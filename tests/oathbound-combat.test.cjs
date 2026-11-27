const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const source=html.match(/<script>([\s\S]*?)<\/script>/)[1];
const boot=source.lastIndexOf('setZoom();let rz;');
assert.ok(boot>0,'Locate the browser bootstrap');
new vm.Script(source);

function harness(){
 const timers=[];
 const context={addEventListener(){},URLSearchParams,location:{search:""},EnemyRigs:{cue(){}},performance,structuredClone,Image:class{},devicePixelRatio:1,
  window:{screen:{width:1440,height:900}},document:{documentElement:{style:{}},addEventListener(){},querySelector(){return null}},
  matchMedia:()=>({matches:true}),CSS:{supports:()=>false},
  setTimeout(cb,ms){if(ms===1100)timers.push(cb);else cb();},clearTimeout(){}};
 const api=vm.runInNewContext(source.slice(0,boot)+`
  render=()=>{};flyCard=async()=>{};rigPose=()=>{};
  const setup=g=>{
   G={hero:'oath',oaths:[g],hp:20,maxHp:80,gold:0,relics:[],deck:[]};screen='combat';Q=[];
   C={busy:false,lock:false,won:false,kind:'fight',turn:1,energy:3,hand:[],draw:[],disc:[],exh:[],exU:[],
    sanc:{aurel:[],orun:[],mora:[],varran:[]},healed:[],once:[],egen:[],p:{block:0,st:{}},
    foes:[{i:0,k:'hollowking',hp:30,block:0,st:{},t:0,int:{}}]};
   combatParty=[C];return {G,C};
  };
  return {setup,endTurn,play,reqMsg,resolveCh,KD,screen:()=>screen,
   choose(fn){pickP=fn;},state:()=>C};
 })()`,context);
 return {...api,timers};
}

test('Orun reflection cannot award victory at 0 HP',async()=>{
 const h=harness(),{G,C}=h.setup('orun');
 G.hp=2;C.p.block=10;Object.assign(C.foes[0],{hp:2,int:{a:12}});
 await h.endTurn();
 assert.equal(G.hp,0);assert.equal(C.foes[0].hp,0);
 assert.equal(h.screen(),'dead');assert.equal(h.state(),null);assert.equal(h.timers.length,0);
});

test('A surviving Orun can still win by reflection',async()=>{
 const h=harness(),{G,C}=h.setup('orun');
 G.hp=3;C.p.block=10;Object.assign(C.foes[0],{hp:2,int:{a:12}});
 await h.endTurn();
 assert.equal(G.hp,1);assert.equal(C.foes[0].hp,0);assert.equal(C.won,true);
 assert.equal(h.timers.length,1);
});

for(const tier of [1,2,3]){
 const setup=()=>{
  const h=harness(),{C}=h.setup('mora');
  const card={id:'penance',u:1,tier,g:'mora'},cost={id:'strike',u:2};
  C.hand=[card,cost];C.draw=[{id:'guard',u:3},{id:'guard',u:4}];
  return {h,C,card,cost};
 };
 test('Mora Penance T'+tier+' cancel leaves play, Energy and rewards untouched',async()=>{
  const {h,C,card,cost}=setup();
  let label;h.choose(async(_title,_choices,action)=>{label=action;return null;});
  await h.play(0,null);
  assert.equal(C.hand[0],card);assert.equal(C.hand[1],cost);assert.equal(C.hand.length,2);
  assert.equal(C.draw.length,2);assert.equal(C.exh.length,0);assert.equal(C.energy,3);
  assert.equal(C.p.st.soul,undefined);assert.equal(C.lock,false);assert.equal(label,'Cancel');
 });
 test('Mora Penance T'+tier+' cannot be played without another card',async()=>{
  const {h,C,card}=setup();C.hand.pop();
  assert.match(h.reqMsg(card),/another card/i);
  h.choose(()=>{throw new Error('No picker should open');});
  await h.play(0,null);
  assert.equal(C.hand[0],card);assert.equal(C.draw.length,2);assert.equal(C.exh.length,0);
  assert.equal(C.lock,false);
 });
 test('Mora Penance T'+tier+' exhausts the chosen card and grants its rewards',async()=>{
  const {h,C,card,cost}=setup();
  h.choose(async(_title,choices)=>{assert.equal(choices.length,1);assert.equal(choices[0],cost);return cost;});
  await h.play(0,null);
  assert.equal(C.exh[0],cost);assert.equal(C.exh.length,1);
  assert.equal(C.hand.length,tier===3?2:1);assert.equal(C.sanc.mora[0],card);
  assert.equal(C.p.st.soul,tier===1?undefined:1);
 });
}

test('optional hand choice still skips without canceling',async()=>{
 const h=harness(),{C}=h.setup('mora');const active={u:1},other={u:2};
 C.hand=[active,other];
 h.choose(async(_title,_choices,label)=>{assert.equal(label,'Skip');return null;});
 assert.equal(await h.resolveCh({k:'hand'},active),null);
});

test('Anointed prevents Condemnation self-Vulnerable and grants Crown of Light Block',()=>{
 const h=harness(),{G,C}=h.setup('aurel');G.relics=['thorns'];C.p.st={anoint:1,crownl:3};
 const e=C.foes[0];h.KD({id:'condemn'}).f(false,e);
 assert.equal(e.st.vuln,2);assert.equal(e.hp,30);
 assert.equal(C.p.st.vuln,undefined);assert.equal(C.p.st.anoint,0);assert.equal(C.p.block,3);
});

test('Condemnation still applies self-Vulnerable without Anointed',()=>{
 const h=harness(),{C}=h.setup('aurel');const e=C.foes[0];
 h.KD({id:'condemn'}).f(true,e);
 assert.equal(e.st.vuln,3);assert.equal(C.p.st.vuln,1);assert.equal(C.p.block,0);
});
