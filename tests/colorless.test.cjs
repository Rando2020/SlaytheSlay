const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const html=fs.readFileSync(require('node:path').join(__dirname,'../index.html'),'utf8');
function game(hero='aether') {
 const ctx=vm.createContext({addEventListener(){},URLSearchParams,location:{search:''},document:{addEventListener(){}},Image:class{},cancelAnimationFrame(){},console,performance:{now:()=>0},structuredClone,setTimeout:cb=>{cb();return 0},window:{scrollTo(){}},localStorage:{setItem(k,v){this[k]=v},getItem(k){return this[k]||null},removeItem(k){delete this[k]}}});
 for(const file of ['assets/maps/act01/registry.js','src/act-map.js','assets/rigs/registry.js','assets/rigs/player.js'])vm.runInContext(fs.readFileSync(require('node:path').join(__dirname,'..',file),'utf8'),ctx);
 const utils=html.slice(html.indexOf('const R=n=>'),html.indexOf('/* ---------- icons and art'));
 const core=html.slice(html.indexOf('/* ---------- data ---------- */'),html.indexOf('/* ---------- input ---------- */'));
 vm.runInContext('const $=()=>null;const RM=true;const RIG={img:{},whip:0};const ART={};function rigPose(){}function swingArc(){}function muzzle(){}'+utils+core+`;render=()=>{};toast=()=>{};banner=()=>{};closeModal=()=>{MD=null};newRun('${hero}');startCombat(['king'],'fight');C.foes[0].hp=C.foes[0].max=9999;C.energy=99;C.hand=[];C.draw=[];C.disc=[];`,ctx);
 return {ctx,run:s=>vm.runInContext(s,ctx),json:s=>JSON.parse(vm.runInContext('JSON.stringify('+s+')',ctx))};
}
test('40 colorless definitions have upgrades and stay outside both class pools',()=>{
 const g=game();assert.equal(g.run('Object.keys(COLORLESS).length'),40);
 assert.equal(g.run('Object.values(COLORLESS).filter(k=>!k.coop).length'),34);
 assert.equal(g.run('Object.values(POOLS).flatMap(p=>Object.values(p).flat()).some(id=>K[id].colorless)'),false);
 for(const id of g.json('Object.keys(COLORLESS)'))for(const up of [0,1]) {
  assert.equal(typeof g.run(`K['${id}'].d(${up})`),'string');
  assert.ok(g.run(`cost({id:'${id}',up:${up}})>=0`));
 }
});
test('Brace uses starting Block; Last Resort upgrade deals 10 or 20',()=>{
 const g=game();g.run("runCard(mk('brace'),null)");assert.equal(g.run('C.p.block'),8);
 g.run("runCard(mk('brace',1),null)");assert.equal(g.run('C.p.block'),14);
 g.run("G.hp=G.maxHp;runCard(mk('last_resort',1),C.foes[0])");assert.equal(g.run('C.foes[0].hp'),9989);
 g.run("G.hp=10;runCard(mk('last_resort',1),C.foes[0])");assert.equal(g.run('C.foes[0].hp'),9969);
});
module.exports={game};
function resolve(g,id,up=0,choices=[],target=true){
 g.run(`{const c=mk('${id}',${up});c._ch=${JSON.stringify(choices)};runCard(c,${target?'C.foes[0]':'null'})}`);
}
function stock(g,n=30){g.run(`C.draw=Array.from({length:${n}},()=>mk('strike'))`)}
test('merchant has five class slots and two distinct colorless slots; rewards remain class focused',()=>{
 for(const hero of ['aether','oath']){const g=game(hero);
  for(let i=0;i<20;i++){
   const shop=g.json('mkShop()');assert.equal(shop.cards.length,7);assert.equal(new Set(shop.cards.map(c=>c.id)).size,7);
   for(const c of shop.cards.slice(0,5))assert.equal(g.run(`!!K['${c.id}'].colorless`),false);
   for(const c of shop.cards.slice(5))assert.equal(g.run(`!!K['${c.id}'].colorless`),true);
   assert.equal(g.run('cardChoices(0).some(id=>K[id].colorless)'),false);
   assert.equal(g.run('colorlessChoices().length'),3);
  }
 }
});
test('simple attacks, defenses, Weak, mark and HP sacrifices at both upgrade levels',()=>{
 for(const up of [0,1]){
  const cases=[['exploit_opening',up?12:9,0],['counterweight',up?7:5,up?5:4],['cheap_shot',up?7:4,0],['diversion',0,up?6:3],['feint',0,up?8:5],['follow_through',up?10:7,0],['improvised_defense',0,up?6:4],['final_word',up?16:12,0]];
  for(const [id,dmg,block]of cases){const g=game();stock(g);g.run('C.foes[0].int={a:9}');resolve(g,id,up);assert.equal(g.run('9999-C.foes[0].hp'),dmg,id);assert.equal(g.run('C.p.block'),block,id);if(id==='diversion')assert.equal(g.run('C.foes[0].st.weak'),1);if(id==='feint')assert.equal(g.run('C.hand.length'),1)}
  const g=game();stock(g);resolve(g,'calculated_risk',up);assert.equal(g.run('G.hp'),67);assert.equal(g.run('C.hand.length'),up?3:2);
  resolve(g,'mark_for_death',up);resolve(g,'counterweight',up);assert.equal(g.run('9999-C.foes[0].hp'),up?16:11);assert.equal(g.run('C.foes[0].neutralMark||0'),0);
  resolve(g,'break_formation',up);assert.equal(g.run('C.foes[0].st.vuln'),1);
 }
});
test('conditional histories include class cards and require the immediate ordered pattern',()=>{
 for(const up of [0,1]){const g=game();g.run("runCard(mk('strike'),C.foes[0])");resolve(g,'follow_through',up);assert.equal(g.run('9999-C.foes[0].hp'),6+(up?10:7));
 g.run("neutralState().history=['atk','skl','pow'];C.foes[0].hp=9999");resolve(g,'broken_pattern',up);assert.equal(g.run('9999-C.foes[0].hp'),up?20:15);
 g.run("neutralState().history=['atk','pow','skl'];C.foes[0].hp=9999");resolve(g,'broken_pattern',up);assert.equal(g.run('9999-C.foes[0].hp'),up?7:5);
 g.run("neutralState().history=Array(20).fill('skl');C.foes[0].hp=9999");resolve(g,'final_word',up);assert.equal(g.run('9999-C.foes[0].hp'),up?34:30);
 g.run("C.hand=[mk('burden'),mk('doubt'),mk('burden'),mk('burden')];C.p.block=0");resolve(g,'improvised_defense',up);assert.equal(g.run('C.p.block'),up?12:10);
 }
});
test('required choices cancel atomically and cannot bypass payment',async()=>{
 const g=game();stock(g);g.run("C.hand=[mk('reconsider'),mk('strike')];pickP=async()=>null");
 const before=g.json('[C.energy,C.hand,C.draw,C.disc]');await g.run('play(0,null)');assert.deepEqual(g.json('[C.energy,C.hand,C.draw,C.disc]'),before);assert.equal(g.run('C.lock'),false);
 for(const id of ['reconsider','salvage','dead_weight']){g.run('C.hand=[]');resolve(g,id);assert.equal(g.run('C.p.block'),0);assert.equal(g.run('C.energy'),99);}
});
test('discard, exhaust, retention, ordered top selection and safe retrieval at both upgrades',()=>{
 for(const up of [0,1]){
  let g=game();stock(g);g.run("C.hand=[mk('strike')];globalThis.chosen=C.hand[0].u");g.run(`{const c=mk('reconsider',${up});c._ch=[chosen];runCard(c,null)}`);assert.equal(g.run('C.disc.length'),1);assert.equal(g.run('C.hand.length'),up?3:2);
  g=game();stock(g);g.run("C.hand=[mk('burden')];globalThis.chosen=C.hand[0].u");g.run(`{const c=mk('salvage',${up});c._ch=[chosen];runCard(c,null)}`);assert.equal(g.run('C.exh.length'),1);assert.equal(g.run('C.hand.length'),up?2:1);assert.equal(g.run('C.energy'),100);
  g=game();g.run("C.hand=[mk('strike')];globalThis.chosen=C.hand[0].u");g.run(`{const c=mk('dead_weight',${up});c._ch=[chosen];runCard(c,null)}`);assert.equal(g.run('C.exh.length'),1);assert.equal(g.run('C.p.block'),up?12:8);
  g=game();g.run("C.hand=[mk('strike'),mk('defend'),mk('bash')];globalThis.ids=C.hand.map(c=>c.u)");g.run(`{const c=mk('hesitation',${up});c._ch=[ids.slice(0,${up?2:1})];runCard(c,null)};neutralDiscardHand()`);assert.equal(g.run('C.hand.length'),up?2:1);g.run('C.turn++;neutralDiscardHand()');assert.equal(g.run('C.hand.length'),0);
  g=game();stock(g,7);const order=g.json('C.draw.map(c=>c.u)');g.run(`{const c=mk('second_opinion',${up});c._ch=[[${order[6]},${order[4]}].slice(0,${up?2:1})];runCard(c,null)}`);assert.deepEqual(g.json('C.draw.map(c=>c.u)'),order.filter(x=>x!==order[6]&&(!up||x!==order[4])));assert.equal(g.run('C.hand.length'),up?2:1);
  g=game('oath');g.run("C.disc=[mk('recover'),mk('strike'),{...mk('invoke'),tier:1,g:'aurel'}, {...mk('strike'),tmpS:'mora'}];globalThis.chosen=C.disc[1].u");assert.equal(g.run('safeDiscards().length'),1);g.run(`{const c=mk('recover',${up});c._ch=[chosen];runCard(c,null)}`);assert.equal(g.run(up?'C.hand.length':'C.draw.length'),1);assert.equal(g.run('C.disc.length'),3);
 }
});
test('delayed energy/draw, penalties, turn-two timing, and Long Game cycles',()=>{
 for(const up of [0,1]){
  const g=game();stock(g,40);resolve(g,'preparation',up);g.run('startTurn()');assert.equal(g.run('C.energy'),4);assert.equal(g.run('C.hand.length'),up?7:6);
  g.run('C.hand=[]');resolve(g,'delayed_gratification',up);g.run('startTurn()');assert.equal(g.run('C.energy'),3);assert.equal(g.run('C.hand.length'),5);g.run('C.hand=[];startTurn()');assert.equal(g.run('C.energy'),5);assert.equal(g.run('C.hand.length'),up?7:5);
  g.run('C.hand=[]');resolve(g,'borrowed_tomorrow',up);assert.equal(g.run('C.energy'),7);g.run('startTurn()');assert.equal(g.run('C.energy'),2);assert.equal(g.run('C.hand.length'),up?4:3);
  g.run('C.hand=[]');resolve(g,'the_long_game',up);g.run('startTurn();C.hand=[];startTurn();C.hand=[];startTurn()');assert.equal(g.run('C.energy'),4);assert.equal(g.run('C.hand.length'),up?7:6);
 }
});
test('per-copy powers, Patience, Contingency and Second Wind respect timing and caps',()=>{
 for(const up of [0,1]){
  const g=game();stock(g,30);resolve(g,'battle_rhythm',up);resolve(g,'holdfast',up);resolve(g,'holdfast',up);resolve(g,'patience',up);resolve(g,'second_wind',up);resolve(g,'second_wind',up);
  g.run("runCard(mk('defend'),null)");assert.equal(g.run('C.p.block'),5);g.run("runCard(mk('strike'),C.foes[0])");assert.equal(g.run('C.p.block'),5+(up?5:3));g.run("runCard(mk('strike'),C.foes[0])");assert.equal(g.run('C.p.block'),5+(up?5:3));
  g.run('neutralEndTurn();neutralEndTurn()');assert.equal(g.run('C.p.block'),5+(up?5:3)+2*(up?8:5));g.run('startTurn()');assert.equal(g.run('C.energy'),4);assert.equal(g.run('C.hand.length'),8);
  g.run('C.hand=[];neutralEndTurn();startTurn()');assert.equal(g.run('C.hand.length'),5);assert.equal(g.run('C.energy'),3);assert.equal(g.run('C.p.block'),up?4:2);
  resolve(g,'contingency',up);g.run('C.p.block=0;G.hp=36;loseHp(2)');assert.equal(g.run('C.p.block'),up?18:12);g.run('G.hp=36;loseHp(2)');assert.equal(g.run('C.p.block'),up?18:12);g.run('C.hand=[];startTurn()');assert.equal(g.run('C.hand.length'),7);
 }
});
test('Unfinished Business returns one physical discard only once, never an exhausted copy',()=>{
 for(const up of [0,1]){const g=game();g.run(`globalThis.card=mk('unfinished_business',${up});runCard(card,C.foes[0]);C.disc.push(card);startTurn()`);assert.equal(g.run('C.hand.filter(x=>x.u===card.u).length'),1);assert.equal(g.run('C.foes[0].hp'),9999-(up?11:7));g.run('C.hand=[];runCard(card,C.foes[0]);C.disc.push(card);startTurn()');assert.equal(g.run('C.hand.length'),1); // normal draw only, no duplicate
 const h=game();h.run("globalThis.card=mk('unfinished_business');runCard(card,C.foes[0]);exhaust(card);startTurn()");assert.equal(h.run('C.hand.length'),0);assert.equal(h.run('C.exh.length'),1);
 }
});
test('Burn the Bridge cap, Reinvention counts, Accept the Cost modes, Against All Odds targets',()=>{
 for(const up of [0,1]){
  let g=game();stock(g);g.run("C.hand=Array.from({length:9},()=>mk('strike'))");resolve(g,'burn_the_bridge',up);assert.equal(g.run('C.energy'),101);assert.equal(g.run('C.exh.length'),9);assert.equal(g.run('C.hand.length'),up?4:3);
  g=game();stock(g);g.run("C.hand=[mk('strike'),mk('defend')]");resolve(g,'reinvention',up);assert.equal(g.run('C.hand.length'),up?4:3);
  for(const mode of [0,1,2]){g=game();stock(g);resolve(g,'accept_the_cost',up,[mode]);assert.equal(g.run('G.hp'),up?67:65);assert.equal(g.run('C.energy'),mode===0?101:99);assert.equal(g.run('C.hand.length'),mode===1?3:0);assert.equal(g.run('C.p.block'),mode===2?15:0);}
  for(const mode of [0,1,2]){g=game();stock(g);resolve(g,'read_the_room',up,[mode,0]);assert.equal(g.run('C.p.block'),mode===0?(up?12:9):0);assert.equal(g.run('C.hand.length'),mode===1?(up?3:2):0);assert.equal(g.run('C.foes[0].st.weak||0'),mode===2?(up?3:2):0);}
  g=game();stock(g);g.run("C.foes[0].int={a:5};C.foes.push({...structuredClone(C.foes[0]),i:1,int:{a:5,target:'ally'}})");resolve(g,'against_all_odds',up);assert.equal(g.run('C.p.block'),up?8:5);assert.equal(g.run('C.hand.length'),2);
 }
});
test('all cooperative concepts have solo behavior, recipient caps and living party routing',()=>{
 for(const up of [0,1]){
 const g=game();stock(g);resolve(g,'cover',up);assert.equal(g.run('C.p.block'),up?10:7);resolve(g,'intercept',up);assert.equal(g.run('C.p.block'),(up?10:7)+(up?14:10));resolve(g,'reinforcements',up);assert.equal(g.run('C.p.block'),(up?10:7)+(up?14:10)+(up?11:8));resolve(g,'rally',up);resolve(g,'supply_cache',up);resolve(g,'supply_cache',up);g.run('startTurn()');assert.equal(g.run('C.energy'),up?6:5);assert.equal(g.run('C.hand.length'),up?8:7);
 g.run("C.party=[{id:'ally',n:'Ally',hp:30,state:{turn:1,p:{block:0,st:{}},hand:[],draw:[],disc:[]}},{id:'dead',hp:0,state:{p:{block:0}}}]");resolve(g,'cover',up,['ally']);resolve(g,'reinforcements',up);assert.equal(g.run('C.party[0].state.p.block'),(up?10:7)+(up?11:8));assert.equal(g.run('C.party[1].state.p.block'),0);resolve(g,'rally',up,['ally']);resolve(g,'supply_cache',up,['ally']);assert.equal(g.run('C.party[0].state.neutralIncoming.length'),2);
 resolve(g,'intercept',up,['ally']);g.run("C.foes[0].int={a:8,x:2,target:'ally'}");assert.equal(g.run('routeNeutralAttack(C.foes[0])'),'self');assert.equal(g.run('routeNeutralAttack(C.foes[0])'),'ally');g.run("hitNeutralRecipient('ally',C.foes[0],50)");assert.ok(g.run('C.party[0].hp<30'));
 }
});
test('legacy and colorless saves roundtrip, upgraded IDs are stable, generation is deterministic with injected RNG',()=>{
 for(const hero of ['oath','aether']){const g=game(hero);g.run('G.deck.push(...Object.keys(COLORLESS).map(id=>mk(id,1)));save();globalThis.old=JSON.stringify(G);G=load()');assert.equal(g.run('JSON.stringify(G)===old'),true);assert.equal(g.run('G.deck.length'),50);assert.equal(g.run('new Set(G.deck.map(c=>c.u)).size'),50);
 g.run('Math.random=()=>0.5');const first=g.json('[cardChoices(0),mkShop()]');const second=g.json('[cardChoices(0),mkShop()]');assert.deepEqual(first,second);
 }
});
test('every card and upgrade resolves through real play for both classes and all four Oaths',async()=>{
 for(const allegiance of ['aether','oath','aurel','varran','orun','mora'])for(const up of [0,1]){
  for(const id of game().json('Object.keys(COLORLESS)')){
   const g=game(allegiance==='aether'?'aether':'oath');stock(g);
   g.run(`G.oaths=${['aether','oath'].includes(allegiance)?'[]':JSON.stringify([allegiance])};C.hand=[mk('${id}',${up}),mk('strike'),mk('burden')];C.disc=[mk('defend')];C.foes[0].neutralAttackTurn=C.turn;pickP=async(t,list)=>list[0]||null;chooseP=async()=>0;globalThis.played=C.hand[0];globalThis.originalDeck=JSON.stringify(G.deck)`);
   await g.run('play(0,KD(played).tg?C.foes[0]:null)');
   assert.equal(g.run('C.lock'),false,`${allegiance} ${id}+${up}`);
   assert.equal(g.run('JSON.stringify(G.deck)===originalDeck'),true,`${id} mutated run deck`);
   const k=g.json(`({t:K['${id}'].t,x:K['${id}'].x||0})`);
   if(k.t==='pow')assert.equal(g.run('neutralState().powers.some(p=>p.u===played.u)'),true,id);
   else assert.equal(g.run(`${k.x?'C.exh':'C.disc'}.filter(c=>c.u===played.u).length`),1,id);
   assert.equal(g.run('C.hand.length<=10'),true,id);
  }
 }
});
test('preview of every colorless card preserves live state, choices, UID, and RNG',()=>{
 const g=game();vm.runInContext(html.match(/function simCard\(c,ti\)\{[^\n]+/)[0],g.ctx);stock(g);
 g.run("C.disc=[mk('defend')];C.hand=[mk('strike'),mk('burden')];globalThis.randomCalls=0;Math.random=()=>{randomCalls++;return .5}");
 for(const id of g.json('Object.keys(COLORLESS)'))for(const up of [0,1]){
  g.run(`globalThis.card=mk('${id}',${up});card._ch=[123];globalThis.before=JSON.stringify([C,G,card,uid,randomCalls]);simCard(card,0)`);
  assert.equal(g.run('JSON.stringify([C,G,card,uid,randomCalls])===before'),true,id);
 }
});
test('actual end turn retains selected cards and checks Second Wind before discard',async()=>{
 const g=game();stock(g);g.run("C.hand=[mk('strike'),mk('defend')];neutralState().retained[C.hand[0].u]=C.turn;runCard(mk('second_wind'),null);C.foes[0].int={b:0}");await g.run('endTurn()');assert.equal(g.run('C.hand.length'),6);assert.equal(g.run('C.energy'),3);
 await g.run('endTurn()');assert.equal(g.run('C.hand.length'),5);assert.equal(g.run('neutralState().windUsed'),false);
});
test('Contingency crossing from start-turn poison keeps its immediate Block',()=>{
 const g=game();stock(g);resolve(g,'contingency');g.run('G.hp=35;C.p.st.poison=1;startTurn()');assert.equal(g.run('C.p.block'),12);
});
test('Supply Cache cap belongs to recipient even when a different player supplies them',()=>{
 const g=game();g.run("C.party=[{id:'ally',hp:30,state:{turn:1,p:{block:0,st:{}}}}]");resolve(g,'supply_cache',0,['ally']);g.run("C.neutral=undefined");resolve(g,'supply_cache',0,['ally']);assert.equal(g.run('C.party[0].state.neutralIncoming.length'),1);
});
test('Cheap Shot requires its target to have already taken Attack HP damage this turn',async()=>{
 const g=game();g.run("C.hand=[mk('cheap_shot')];C.foes[0].int={a:5}");assert.ok(g.run('reqMsg(C.hand[0])'));
 g.run("runCard(mk('strike'),C.foes[0]);C.foes.push({...structuredClone(C.foes[0]),i:1,neutralAttackTurn:-1})");assert.equal(g.run('reqMsg(C.hand[0])'),null);
 await g.run('play(0,C.foes[1])');assert.equal(g.run('C.hand.length'),1);assert.equal(g.run('C.energy'),99);
 await g.run('play(0,C.foes[0])');assert.equal(g.run('C.exh.length'),1);g.run('startTurn();C.hand=[mk("cheap_shot")]');assert.ok(g.run('reqMsg(C.hand[0])'));
});
test('Mark waits for an Attack card and applies once across multi-hits; HP costs respect Aurel',()=>{
 const g=game('oath');resolve(g,'mark_for_death');g.run("K.test_damage={t:'skl',f:()=>atk(C.foes[0],1)};runCard({id:'test_damage'},null)");assert.equal(g.run('C.foes[0].neutralMark'),6);g.run("runCard(mk('twin'),C.foes[0])");assert.equal(g.run('9999-C.foes[0].hp'),17);
 g.run("G.oaths=['aurel']");resolve(g,'calculated_risk');assert.equal(g.run('C.p.st.tstr'),-1);assert.equal(g.run('C.p.st.tdex'),-1);
});
test('Against All Odds applies Dexterity once to the total, and Intercept waits for the next eligible attack',()=>{
 const g=game();g.run("C.p.st.dex=2;C.foes[0].int={a:5};C.foes.push({...structuredClone(C.foes[0]),i:1})");resolve(g,'against_all_odds');assert.equal(g.run('C.p.block'),12);
 g.run("C.party=[{id:'ally',hp:30,state:{turn:1,p:{block:0,st:{}}}}]");resolve(g,'intercept',0,['ally']);g.run("C.turn++;C.foes[0].int={a:5,target:'ally'}");assert.equal(g.run('routeNeutralAttack(C.foes[0])'),'self');
});
test('retrieval at hand cap cannot duplicate or lose a physical card; stacked draw penalties never Divine Draw',()=>{
 const g=game('oath');g.run("C.hand=Array.from({length:10},()=>mk('strike'));C.disc=[mk('defend')];globalThis.id=C.disc[0].u;retrieveNeutral(id,'hand')");assert.equal(g.run('C.hand.length'),10);assert.equal(g.run('C.disc.filter(c=>c.u===id).length'),1);
 g.run("G.oaths=['aurel'];C.hand=[];C.sanc.aurel=[{...mk('invoke'),tier:1,g:'aurel',dturn:-1}]");stock(g);for(let i=0;i<4;i++)resolve(g,'borrowed_tomorrow');g.run('startTurn()');assert.equal(g.run('C.hand.length'),0);assert.equal(g.run('C.sanc.aurel.length'),1);assert.equal(g.run('C.energy'),0);
});
function nativeParty(g){g.run("G=bindParty({party:['aether','oath'].map(hero=>({hero,hp:HEROES[hero].hp,maxHp:HEROES[hero].hp,gold:99,deck:Array.from({length:20},()=>mk('strike')),relics:[],oaths:[]})),seat:0,seed:77,map:[],floor:1});startCombat(['king'],'fight');C.foes[0].hp=C.foes[0].max=9999;C.foes[0].int={a:4,x:2}")}
test('native party support targets living seats and carries pre-turn Block through recipient reset',async()=>{
 const g=game();nativeParty(g);resolve(g,'cover',0,[1]);resolve(g,'reinforcements');resolve(g,'rally',0,[1]);resolve(g,'supply_cache',0,[1]);assert.equal(g.run('combatParty[1].p.block'),15);
 await g.run('endTurn()');assert.equal(g.run('activeSeat()'),1);assert.equal(g.run('C.p.block'),15);assert.equal(g.run('C.hand.length'),7);assert.equal(g.run('C.energy'),5);assert.ok(g.run('reqMsg(mk("supply_cache"))===null'),'other recipient still eligible');resolve(g,'supply_cache',0,[1]);assert.equal(g.run('C.neutralIncoming.length'),0,'different provider cannot supply same recipient twice');
 resolve(g,'mark_for_death');g.run('focusCombatSeat(0)');resolve(g,'counterweight');assert.equal(g.run('9999-C.foes[0].hp'),11);
});
test('native Intercept redirects an explicit single-target multi-hit action, never party-wide attacks',async()=>{
 const g=game();nativeParty(g);g.run('C.p.block=0');resolve(g,'intercept',0,[1]);await g.run('endTurn()');g.run('C.foes[0].int={a:7,x:2,target:1}');await g.run('endTurn()');assert.equal(g.run('partyMember(0).hp'),66);assert.equal(g.run('partyMember(1).hp'),80);
 const h=game();nativeParty(h);resolve(h,'intercept',0,[1]);await h.run('endTurn()');await h.run('endTurn()');assert.equal(h.run('partyMember(0).hp'),70);assert.equal(h.run('partyMember(1).hp'),72);assert.equal(h.run('combatParty[0].neutral.redirects.length'),1);
});
test('party previews cannot mutate other members or their combat states, and Threshold seed outputs stay stable',()=>{
 const g=game();nativeParty(g);vm.runInContext(html.match(/function simCard\(c,ti\)\{[^\n]+/)[0],g.ctx);
 for(const id of ['cover','rally','supply_cache','reinforcements']){g.run(`globalThis.before=JSON.stringify([G,combatParty]);simCard(mk('${id}'),0)`);assert.equal(g.run('JSON.stringify([G,combatParty])===before'),true,id)}
 g.run("newRunSeed('oath',1234);globalThis.a=JSON.stringify([G.map,G.threshold.offers]);newRunSeed('oath',1234)");assert.equal(g.run('JSON.stringify([G.map,G.threshold.offers])===a'),true);
});

test('cartridge shots, optional discards, and Split Breech share combat resolution',()=>{
 const g=game();
 resolve(g,'demon',0,[],false);
 resolve(g,'bash');
 assert.equal(g.run('C.foes[0].hp'),9993);
 g.run("C.hand=[mk('defend'),mk('strike')]");
 resolve(g,'bash',0,[g.run('C.hand[0].u'),0]);
 assert.equal(g.run('C.foes[0].hp'),9978);
 resolve(g,'catalyst',0,[g.run('C.hand[0].u'),0]);
 assert.equal(g.run('C.foes[0].hp'),9971);
 assert.equal(g.run('C.foes[0].st.vuln'),2);
 assert.equal(g.run('C.disc.length'),2);
});
test('changing targets weakens the second foe and stone remembers absorbed hits by foe',()=>{
 const g=game('oath');
 g.run("C.foes.push({...C.foes[0],i:1,st:{}});runCard(mk('strike'),C.foes[0]);runCard(mk('follow_through'),C.foes[1])");
 assert.equal(g.run('C.foes[1].st.weak'),1);
 g.run("C.p.block=10;hitMe(C.foes[0],4);hitMe(C.foes[0],9)");
 assert.equal(g.run('stoneBonus(C.foes[0])'),8);
 assert.equal(g.run('stoneBonus(C.foes[1])'),0);
});
test('Sporeling still inflicts Poison and the next turn consumes a stack',()=>{
 const g=game();
 g.run("C.foes[0].k='spore';C.foes[0].hp=0;fell(C.foes[0]);globalThis.prePoison=G.hp;startTurn()");
 assert.equal(g.run('prePoison-G.hp'),2);
 assert.equal(g.run('C.p.st.poison'),1);
});

test('Covering Shot grants Block only against attack intents, including on a finishing shot',()=>{
 for(const up of [0,1]){
  const g=game();
  g.run("C.foes[0].int={b:8}");
  resolve(g,'iron',up);
  assert.equal(g.run('C.p.block'),0);
  assert.equal(g.run('9999-C.foes[0].hp'),up?9:6);
  g.run("C.foes[0].hp=1;C.foes[0].int={a:5}");
  resolve(g,'iron',up);
  assert.equal(g.run('C.p.block'),5);
 }
});
test('Pocket the Brass banks the card for the following turn only after a cartridge discard',()=>{
 const g=game();stock(g);
 resolve(g,'shrug',0,[],false);
 assert.equal(g.run('C.neutralIncoming?.length||0'),0);
 g.run("C.hand=[mk('defend')]");
 resolve(g,'bash',0,[g.run('C.hand[0].u')]);
 resolve(g,'shrug',1,[],false);
 assert.equal(g.run('C.p.block'),17);
 assert.equal(g.run('C.hand.length'),0);
 g.run('startTurn()');
 assert.equal(g.run('C.hand.length'),6);
 assert.equal(g.run('C.neutralIncoming.length'),0);
});
test('Rivet Punch strips armor before ordinary attack damage and gets no bonus on bare targets',()=>{
 for(const up of [0,1])for(const block of [0,4,20]){
  const g=game();g.run('C.foes[0].block='+block);
  resolve(g,'heavy',up);
  const remaining=Math.max(0,block-(up?10:7));
  assert.equal(g.run('9999-C.foes[0].hp'),Math.max(0,(up?15:12)-remaining));
  assert.equal(g.run('C.foes[0].block'),Math.max(0,remaining-(up?15:12)));
 }
});
