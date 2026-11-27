'use strict';
const http = require('node:http');
const {randomBytes, randomInt} = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const MAX_BODY = 256 * 1024;
const ROOM_TTL = 6 * 60 * 60 * 1000;
const ONLINE_TTL = 30 * 1000;
const mime = {'.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8',
  '.webp':'image/webp', '.jpg':'image/jpeg', '.png':'image/png'};

function fail(status, message) {
  throw Object.assign(new Error(message), {status});
}

function reply(res, value, status = 200) {
  res.writeHead(status, {'Content-Type':'application/json', 'Cache-Control':'no-store'});
  res.end(JSON.stringify(value));
}

async function body(req) {
  if ((req.headers['content-type'] || '').split(';')[0].trim() !== 'application/json')
    fail(415, 'Send JSON.');
  let length = 0;
  const chunks = [];
  for await (const chunk of req) {
    length += chunk.length;
    if (length > MAX_BODY) fail(413, 'Room update is too large.');
    chunks.push(chunk);
  }
  let parsed;
  try { parsed = JSON.parse(Buffer.concat(chunks).toString('utf8')); }
  catch { fail(400, 'Invalid JSON.'); }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) fail(400, 'Expected an object.');
  return parsed;
}

function newSeat() {
  return {token:randomBytes(32).toString('base64url'), seen:Date.now()};
}

function validView(view) {
  if (view === null) return true;
  return view && typeof view.title === 'string' && Array.isArray(view.details) &&
    view.details.every(text => typeof text === 'string') && Array.isArray(view.actions) &&
    view.actions.every(action => action && typeof action.label === 'string' &&
      (action.image === undefined || typeof action.image === 'string'));
}

function roomCode() {
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({length:6}, () => letters[randomInt(letters.length)]).join('');
}

function createCoopServer() {
  const rooms = new Map();
  function expire() {
    const cutoff = Date.now() - ROOM_TTL;
    for (const [code, room] of rooms) if (room.seats[0].seen < cutoff) rooms.delete(code);
  }

  async function serve(req, res) {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    const url = new URL(req.url, 'http://localhost');
    if (!url.pathname.startsWith('/api/')) {
      if (!['GET','HEAD'].includes(req.method)) fail(405, 'Method unavailable.');
      const name = decodeURIComponent(url.pathname.slice(1)) || 'index.html';
      if (!['index.html','coop-online.js'].includes(name) &&
          !/^(assets|art)\/(?:[a-zA-Z0-9_-]+\/)*[a-zA-Z0-9_. -]+\.(?:png|jpg|webp)$/.test(name))
        fail(404, 'File unavailable.');
      const file = path.join(root, name);
      const stat = await fs.promises.stat(file).catch(() => null);
      if (!stat || !stat.isFile()) fail(404, 'File unavailable.');
      res.writeHead(200, {'Content-Type':mime[path.extname(file)], 'Content-Length':stat.size});
      if (req.method === 'HEAD') return res.end();
      const stream = fs.createReadStream(file);
      res.on('close', () => stream.destroy());
      stream.on('error', () => res.destroy()).pipe(res);
      return;
    }
    if (req.headers.origin && new URL(req.headers.origin).host !== req.headers.host)
      fail(403, 'Use the same server for the game and room.');
    if (url.pathname === '/api/coop' && req.method === 'GET') return reply(res, {version:1});
    expire();
    if (req.method === 'POST' && url.pathname === '/api/rooms') {
      const {size} = await body(req);
      if (!Number.isInteger(size) || size < 2 || size > 4) fail(400, 'Choose two to four players.');
      if (rooms.size >= 128) fail(503, 'Server is full.');
      let code;
      do { code = roomCode(); } while (rooms.has(code));
      const host = newSeat();
      rooms.set(code, {size, seats:[host], seq:0, snapshot:null, pending:null});
      return reply(res, {room:code, seat:0, token:host.token});
    }

    const match = /^\/api\/rooms\/([A-Z0-9]{6})\/(join|poll|state|action|close)$/.exec(url.pathname);
    if (!match) fail(404, 'Unknown endpoint.');
    const [,code,route] = match;
    if (req.method !== (route === 'poll' ? 'GET' : 'POST')) fail(405, 'Method unavailable.');
    const data = route === 'poll' ? null : await body(req);
    const room = rooms.get(code);
    if (!room) fail(404, 'Room expired or unknown.');
    if (route === 'join') {
      if (room.seats.length >= room.size) fail(409, 'Room is full.');
      const guest = newSeat();
      const seat = room.seats.push(guest) - 1;
      return reply(res, {room:code, seat, token:guest.token});
    }
    const seat = room.seats.findIndex(peer => req.headers.authorization === 'Bearer ' + peer.token);
    if (seat < 0) fail(401, 'Unrecognized seat.');
    room.seats[seat].seen = Date.now();
    if (route === 'poll') {
      const since = Number(url.searchParams.get('since') || 0);
      const peers = room.seats.map((peer, i) => peer.seen >= Date.now()-ONLINE_TTL ? i : -1)
        .filter(i => i >= 0);
      const actions = seat === 0 && room.pending && room.pending.id > since ? [room.pending] : [];
      return reply(res, {size:room.size, peers, seq:room.seq, snapshot:room.snapshot, actions});
    }
    if (route === 'close') {
      if (seat !== 0) fail(403, 'Only the host can close the room.');
      rooms.delete(code);
      return reply(res, {ok:true});
    }
    if (route === 'state') {
      if (seat !== 0) fail(403, 'Only the host can publish state.');
      const {view, activeSeat, revision, ack = 0} = data;
      if (!Number.isSafeInteger(revision) || revision < 0 ||
          !Number.isInteger(activeSeat) || activeSeat < -1 || activeSeat >= room.size ||
          !Number.isSafeInteger(ack) || ack < 0 || ack > room.seq ||
          !validView(view))
        fail(400, 'Invalid room state.');
      if (room.snapshot && revision <= room.snapshot.revision) fail(409, 'Stale state.');
      if (room.pending && room.pending.id <= ack) room.pending = null;
      room.snapshot = {view, activeSeat, revision};
      return reply(res, {ok:true});
    }

    const {revision, action} = data;
    const snapshot = room.snapshot;
    if (!snapshot || snapshot.activeSeat !== seat || seat === 0) fail(403, 'Wait for your turn.');
    if (revision !== snapshot.revision || room.pending) fail(409, 'Action is stale or pending.');
    if (!Number.isInteger(action) || action < 0 || action >= (snapshot.view?.actions.length || 0))
      fail(400, 'Unknown action.');
    room.pending = {id:++room.seq, seat, revision, action};
    reply(res, {ok:true, id:room.seq});
  }

  return http.createServer({requestTimeout:15000, headersTimeout:10000}, (req, res) => {
    serve(req, res).catch(error => {
      if (res.headersSent) return res.destroy();
      const status = error.status || (error instanceof URIError || error instanceof TypeError ? 400 : 500);
      reply(res, {error:error.status ? error.message : 'Request failed.'}, status);
    });
  });
}

module.exports = {createCoopServer};
if (require.main === module) {
  const port = Number(process.env.PORT || 8787);
  const host = process.env.HOST || '0.0.0.0';
  const server = createCoopServer();
  server.listen(port, host, () => console.log('Hollow Ascent co-op listening on ' + host + ':' + server.address().port));
}
