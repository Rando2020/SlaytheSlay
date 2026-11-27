/* Remote guests use a turn controller. Only the host runs the game simulation. */
(() => {
  'use strict';
  const q = sel => document.querySelector(sel);
  const el = (tag, text) => Object.assign(document.createElement(tag), {textContent:text || ''});
  const app = q('#app'), modal = q('#modal');
  const panel = el('section'), bar = el('div');
  panel.className = 'online-panel';
  bar.className = 'online-bar';
  document.body.append(panel, bar);
  const style = el('style', `
    .online-panel:empty,.online-bar:empty{display:none}
    .online-panel{position:fixed;inset:0;overflow:auto;background:#171512;color:#f4ecd7;padding:clamp(20px,6vw,80px);z-index:5000}
    .online-panel>*{max-width:780px;margin:0 auto 15px;display:block}
    .online-panel .row{justify-content:flex-start;gap:10px;display:flex;flex-wrap:wrap}
    .online-panel button,.online-panel select,.online-panel input,.online-bar button{font:inherit;padding:9px;border:1px solid #877452;border-radius:5px;background:#322b22;color:#fff6df}
    .online-panel button{cursor:pointer;text-align:left}.online-panel button:disabled{opacity:.65;cursor:default}
    .online-panel .online-actions{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:8px}
    .online-actions img{width:50px;height:55px;object-fit:contain;float:left;margin-right:8px}
    .online-bar{position:fixed;right:8px;top:5px;z-index:5001;font:12px system-ui}
    body.online-host #app{padding-top:38px}
  `);
  document.head.append(style);
  const key = 'hollow-ascent-online-seat';
  let session, peers = [], snapshot, active = false, timer, revision = 0, ack = 0;
  let published = '', lastDisplay = '', message = '', pending = false, applying = false;
  const button = (label, fn) => {
    const b = el('button', label);
    b.type = 'button';
    b.addEventListener('click', fn);
    return b;
  };
  async function api(path, data) {
    const r = await fetch('/api/' + path, {
      method:data === undefined ? 'GET' : 'POST', cache:'no-store',
      headers:{'Content-Type':'application/json', ...(session ? {Authorization:'Bearer '+session.token} : {})},
      ...(data === undefined ? {} : {body:JSON.stringify(data)})
    });
    if (!r.ok) throw Object.assign(new Error((await r.json().catch(()=>({}))).error || 'Room request failed'), {status:r.status});
    return r.json();
  }
  const path = () => 'rooms/' + session.room;
  function reset() {
    clearTimeout(timer);
    sessionStorage.removeItem(key);
    session = snapshot = null;
    active = pending = false;
    peers = []; revision = ack = 0; published = lastDisplay = message = '';
    panel.replaceChildren(); bar.replaceChildren();
    document.body.classList.remove('online-host');
    installEntry();
  }
  function installEntry() {
    const row = app.querySelector('.tbody .row');
    if (row && !session && !row.querySelector('.online-entry')) {
      const b = button('Online co-op', lobby);
      b.className = 'btn online-entry'; row.append(b);
    }
  }
  async function closeRoom() {
    try {
      await api(path()+'/close',{});
      const reload=active;
      reset();
      if(reload) location.reload();
    } catch(e) { bar.textContent=e.message; }
  }
  function lobby() {
    panel.replaceChildren(el('h2','Online co-op'));
    const size = el('select'); size.setAttribute('aria-label','Party size');
    for(const n of [2,3,4]) size.add(new Option(n+' players', n));
    const code = el('input'); code.placeholder = 'Room code'; code.maxLength = 12; code.autocomplete='off';
    code.setAttribute('aria-label','Room code');
    const note = el('p','Open this game address on each device. The host keeps this tab open during the run.');
    const create = button('Create room',()=>connect(true));
    const join = button('Join room',()=>connect(false));
    async function connect(host) {
      create.disabled = join.disabled = true;
      try {
        const roomCode = code.value.trim().toUpperCase();
        if (!host && !/^[A-Z0-9]{4,12}$/.test(roomCode)) throw new Error('Enter the room code from the host.');
        session = await api(host ? 'rooms' : 'rooms/'+roomCode+'/join',host ? {size:Number(size.value)} : {});
        if(session.seat) sessionStorage.setItem(key,JSON.stringify(session));
        message=''; tick();
      } catch(e) {note.textContent=e.message;create.disabled=join.disabled=false;}
    }
    for(const pair of [[size,create],[code,join]]) {
      const row=el('div');row.className='row';row.append(...pair);panel.append(row);
    }
    panel.append(note,button('Back',reset));
  }
  const clean = s => String(s || '').replace(/\s+/g,' ').trim();
  function label(n) {
    const parts = [...n.querySelectorAll('.cost,.nm,.ds,.it,.fn,.hpt,.hb,.hs,b')].filter(x=>!x.parentElement.closest('.ds,.it,.hb,.hs,b'));
    const summary = parts.map(x=>clean((x.title ? x.title+' ' : '')+x.textContent)).filter(Boolean).join(' · ');
    let text = summary || clean(n.textContent) || n.getAttribute('aria-label') || n.title || n.dataset.a;
    if(n.dataset.a==='go') text += ' · path '+(Number(n.dataset.v.split(',')[1])+1);
    if(n.closest('.ware')) text += ' · '+clean(n.closest('.ware').querySelector('.price')?.textContent);
    return text.slice(0,800);
  }
  function capture() {
    const root = modal.firstElementChild ? modal : app;
    const nodes = [...root.querySelectorAll('[data-a]')].filter(n=>!n.disabled && !['new','cont','title'].includes(n.dataset.a));
    const details = [...root.querySelectorAll('.sub,.top .stat,.party-hud span,.party-hud strong,.piles,.orb,.hint,.unit.hero .info,.panel h3,.maphead p,.grid .card:not([data-a])')].map(n=>clean(n.innerText||n.textContent)).filter(Boolean);
    const view = {title:clean(root.querySelector('h1,h2,.hint')?.textContent)||'Hollow Ascent',
      details, actions:nodes.map(n=>({label:label(n),image:n.querySelector('.art img,.hp img,.enemy-idle')?.getAttribute('src') || ''}))};
    const seat = window.coopActiveSeat();
    return {view,nodes,seat,signature:JSON.stringify([seat,view,nodes.map(n=>[n.dataset.a,n.dataset.v])])};
  }
  async function hostSync(state) {
    for(const a of state.actions || []) {
      if(a.id<=ack) continue;
      const c = capture();
      if(a.revision===revision && a.seat===c.seat && c.signature===published && c.nodes[a.action]) {
        applying=true;
        try { c.nodes[a.action].dispatchEvent(new MouseEvent('click',{bubbles:true})); }
        finally {applying=false;}
      }
      ack=a.id; published='';
    }
    const c = capture();
    if(c.signature!==published) {
      const next=Math.max(revision,state.snapshot?.revision||0)+1;
      await api(path()+'/state',{view:c.view,activeSeat:c.seat,revision:next,ack});
      revision=next;published=c.signature;
    }
  }
  function display(state) {
    const host = session.seat===0;
    snapshot=state.snapshot; peers=state.peers;
    const started=host ? active : !!snapshot;
    const id=JSON.stringify([started,peers,snapshot?.revision,pending,message]);
    if(id===lastDisplay) return;
    lastDisplay=id;
    const room='Room '+session.room+' · Player '+(session.seat+1);
    bar.replaceChildren();panel.replaceChildren();
    if(host && started) {
      document.body.classList.add('online-host');
      const badge=el('span',room+' · '+(peers.length===state.size?'connected':'waiting for reconnect')+' '+message);
      badge.style.background='#171512';bar.append(badge);
      bar.append(button('Close room',()=>{
        if(app.querySelector('.panel.end') || confirm('Close the room for everyone?')) closeRoom();
      }));
      return;
    }
    panel.append(el('h2',room));
    if(!started) {
      panel.append(el('p',peers.length+' of '+state.size+' players connected. Share this page address and room code with your party.'));
      if(host) {
        const b=button('Choose characters',()=>{active=true;window.coopStartParty(state.size);panel.replaceChildren();});
        b.disabled=peers.length!==state.size;panel.append(b);
      }
    } else {
      const myTurn=snapshot.activeSeat===session.seat;
      panel.append(el('h3',snapshot.view.title),el('p',!peers.includes(0)?'Waiting for the host to reconnect':myTurn?'Your turn':snapshot.activeSeat<0?'Watching the host board':'Player '+(snapshot.activeSeat+1)+' is choosing'));
      for(const d of snapshot.view.details || []) panel.append(el('p',d));
      const grid=el('div');grid.className='online-actions';
      snapshot.view.actions.forEach((a,i)=>{
        const b=button(a.label,()=>send(i,snapshot.revision));
        b.disabled=!myTurn || pending || !peers.includes(0);
        if(/^assets\/(?:[\w-]+\/)*[\w.-]+\.(?:png|webp|jpg)$/i.test(a.image)){
          const img=el('img');img.src=a.image;img.alt='';b.prepend(img);
        }
        grid.append(b);
      });
      panel.append(grid);
    }
    if(message) panel.append(el('p',message));
    if(!started && host) panel.append(button('Close lobby',closeRoom));
    if(!host && (!peers.includes(0) || (snapshot?.activeSeat===-1 && !snapshot.view.actions.length))) {
      panel.append(button('Return to title',reset));
    }
  }
  async function send(action,rev) {
    if(pending) return;
    pending=true;panel.querySelectorAll('.online-actions button').forEach(b=>b.disabled=true);
    try {await api(path()+'/action',{action,revision:rev});}
    catch(e){pending=false;message=e.message;lastDisplay='';}
  }
  async function tick() {
    const current=session;
    if(!current) return;
    try {
      const state=await api(path()+'/poll?since='+ack);
      if(session!==current) return;
      if(!current.seat && active) await hostSync(state);
      if(state.snapshot?.revision!==snapshot?.revision) pending=false;
      message='';display(state);
    } catch(e) {
      if(session!==current) return;
      if([401,403,404,410].includes(e.status)){
        reset();lobby();panel.prepend(el('p','This room has closed. Create or join a new room.'));return;
      }
      message='Connection interrupted. Reconnecting…';
      bar.textContent=message;lastDisplay='';
    }
    if(session===current) timer=setTimeout(tick,450);
  }
  for(const type of ['click','pointerdown','pointerup','keydown']) {
    window.addEventListener(type,e=>{
      if(session?.seat===0 && active && !applying && !bar.contains(e.target) && window.coopActiveSeat()!==0) {
        e.stopImmediatePropagation();
        if(type!=='keydown' || ['e','E','Escape'].includes(e.key) || /^\d$/.test(e.key)) e.preventDefault();
      }
    },true);
  }
  if(location.protocol==='http:' || location.protocol==='https:') api('coop').then(info=>{
    if(info.version!==1) return;
    new MutationObserver(installEntry).observe(app,{childList:true});
    installEntry();
    try {session=JSON.parse(sessionStorage.getItem(key));} catch {session=null;}
    if(session?.seat>0) tick();
  }).catch(()=>{});
})();
