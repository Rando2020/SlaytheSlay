const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

function runThresholdChecks(html,check){
 const block=(a,b)=>html.slice(html.indexOf(a),html.indexOf(b,html.indexOf(a)));
 const line=a=>html.split('\n').find(s=>s.startsWith(a));
 const code=[
 'const window={};let G=null,C=null,screen="title",uid=1,saved=null;const save=()=>{saved=JSON.stringify(G)},render=()=>{},closeModal=()=>{};',
 block('const K={','const POOLS='),line('const POOLS='),line('const POOL='),line('const ACT='),line('const godOf='),line('const ordinaryCount='),block('const HEROES=','let SIM='),block('const RELICS=','const STN='),line('const mk='),line('const upgradable='),
 'const gainRelic=k=>{G.relics.push(k);if(k==="moss"){G.maxHp+=8;G.hp+=8}};',
 block('/* ---------- The Threshold ---------- */','function mkShop()'),
 'return {start:newRunSeed,select:selectBlessing,resolve:resolveBlessing,combat:thresholdCombat,won:thresholdCombatWon,price:merchantPrice,goMap,registry:BLESSINGS,eligible:unlockedBlessings,state:()=>G,screen:()=>screen,save:()=>saved,reload:()=>{G=JSON.parse(saved);uid=Math.max(0,...G.deck.map(c=>c.u))+1;screen="title";goMap()},shop:()=>{screen="shop";goMap()}}'
 ].join('\n');
 const g=new Function(code)();
 const equal=(a,b,msg)=>check(JSON.stringify(a)===JSON.stringify(b),msg);
 equal(g.registry.length,12,'12 registry definitions');
 for(const hero of ['aether','oath']){
  g.start(hero,13);const first=JSON.stringify(g.state());g.start(hero,13);equal(JSON.stringify(g.state()),first,hero+' deterministic map and offerings');
  g.reload();equal(JSON.stringify(g.state()),first,'pending offering save reload');equal(g.screen(),'threshold','resume threshold');
  check(g.eligible().length===10,hero+' has ten supported blessings');
  const seen=new Set();
  for(let seed=0;seed<100;seed++){
   g.start(hero,seed);const offers=g.state().threshold.offers;check(offers.length===3&&new Set(offers).size===3,'three unique offerings');offers.forEach(id=>seen.add(id));
   for(const id of offers){
    g.start(hero,seed);const before=JSON.parse(JSON.stringify(g.state()));g.select('invalid');equal(g.state(),before,'invalid selection ignored');
    g.select(id);const p=g.state().threshold.pending;
    if(p){const pending=JSON.stringify(g.state());g.reload();equal(JSON.stringify(g.state()),pending,'pending choice survives reload');g.select(offers.find(x=>x!==id));equal(JSON.stringify(g.state()),pending,'second blessing blocked');g.resolve('invalid');equal(JSON.stringify(g.state()),pending,'invalid target blocked');g.resolve(String(p.choices[0]));}
    const after=g.state();check(after.threshold.applied&&after.threshold.selected===id&&g.screen()==='map','selection finishes exactly once');
    if(id==='second-breath'){equal(after.maxHp,before.maxHp+8,'max HP');equal(after.hp,before.hp+8,'current HP')}
    if(id==='fortune')equal(after.gold,before.gold+100,'gold');
    if(id==='knowledge')equal(after.deck.length,before.deck.length+1,'card added');
    if(id==='purification')equal(after.deck.length,before.deck.length-1,'card removed');
    if(id==='tempered')check(after.deck.some(c=>c.up===1),'card upgraded');
    if(id==='fallen')equal(after.relics.length,before.relics.length+1,'relic added');
    if(id==='reforged'){equal(after.deck.length,before.deck.length,'transform deck size');check(after.deck.some(c=>!before.deck.some(d=>d.u===c.u)),'transform fresh UID')}
    const applied=JSON.stringify(after);g.select(id);g.resolve('1');g.reload();equal(JSON.stringify(g.state()),applied,'applied save cannot replay');
    if(id==='first-light'||id==='sheltered'){for(let n=0;n<3;n++){check(id==='first-light'?g.combat().energy===1:g.combat().block===8,'combat effect active');g.won();g.goMap();g.reload()}equal(g.combat(),{},'combat effect expires')}
    if(id==='merchant'){equal(g.price(100),70,'discount');equal(g.price(75),53,'removal discount');g.shop();g.reload();equal(g.price(100),100,'first shop only')}
   }
  }
  equal(seen.size,10,hero+' all active blessings sampled');
 }
}

test('Threshold: seeded offers, effects, persistence and both classes',()=>runThresholdChecks(fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8'),(ok,msg)=>assert.ok(ok,msg)));
