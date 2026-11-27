'use strict';
const {test} = require('node:test');
const assert = require('node:assert/strict');
const {createCoopServer} = require('../tools/coop-server.cjs');

test('room seats, authoritative actions, retries, and reconnection', async t => {
  const server = createCoopServer();
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise(resolve => server.close(resolve)));
  const base = 'http://127.0.0.1:' + server.address().port;
  const post = (route, data, token) => fetch(base + route, {method:'POST',
    headers:{'Content-Type':'application/json', Authorization:'Bearer ' + (token || '')},
    body:JSON.stringify(data)});
  const host = await (await post('/api/rooms', {size:2})).json();
  assert.match(host.room, /^[A-Z0-9]{6}$/);
  const route = '/api/rooms/' + host.room;
  const guest = await (await post(route + '/join', {})).json();
  assert.equal(guest.seat, 1);
  assert.equal((await post(route + '/join', {})).status, 409);
  const get = (seat, since = 0) => fetch(base + route + '/poll?since=' + since,
    {headers:{Authorization:'Bearer ' + seat.token}}).then(r => r.json());
  const state = {revision:1, activeSeat:1, view:{title:'Combat', details:[], actions:[{label:'End turn'}]}};
  assert.equal((await post(route + '/state', state, guest.token)).status, 403);
  assert.equal((await post(route + '/state', state, host.token)).status, 200);
  assert.equal((await post(route + '/action', {revision:0, action:0}, guest.token)).status, 409);
  assert.equal((await post(route + '/action', {revision:1, action:2}, guest.token)).status, 400);
  const play = () => post(route + '/action', {revision:1, action:0}, guest.token);
  assert.equal((await play()).status, 200);
  assert.equal((await play()).status, 409);
  const first = await get(host);
  assert.deepEqual(first.actions, [{id:1, seat:1, action:0, revision:1}]);
  assert.deepEqual((await get(host)).actions, first.actions);
  assert.deepEqual((await get(guest)).actions, []);
  assert.deepEqual((await get(guest)).peers, [0,1]);
  assert.equal((await post(route + '/state', {...state,revision:2,activeSeat:0,ack:1}, host.token)).status, 200);
  assert.deepEqual((await get(host)).actions, []);
  assert.equal((await play()).status, 403);
  assert.deepEqual((await get(guest)).snapshot.revision, 2);
  assert.equal((await fetch(base + route + '/poll')).status, 401);
  assert.equal((await post(route + '/close', {}, guest.token)).status, 403);
  assert.equal((await post(route + '/close', {}, host.token)).status, 200);
  assert.equal((await get(guest)).error, 'Room expired or unknown.');
  assert.equal((await fetch(base + '/tools/coop-server.cjs')).status, 404);
  assert.equal((await fetch(base + '/assets/bg_gate.webp', {method:'HEAD'})).status, 200);
});
