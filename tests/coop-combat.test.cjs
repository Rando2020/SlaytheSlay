const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const game = html.match(/<script>\s*\(\(\)=>\{([\s\S]*?)\}\)\(\);\s*<\/script>/)[1];

// Run the shipped game with real action handlers and views. Only the browser
// surfaces, animation timers and local storage are substituted.
function launch(heroes, storage = new Map(), leaveThreshold = false) {
  const app = {style: {}, clientWidth: 1000};
  const modal = {style: {}};
  const noop = () => {};
  const ctx = vm.createContext({
    URLSearchParams, location:{search:""}, cancelAnimationFrame:noop,
    document: {
      documentElement: {style: {}},
      createElement: () => ({style:{}, remove:noop}),
      body: {appendChild:noop},
      addEventListener: noop,
      querySelector: q => q === '#app' ? app : q === '#modal' ? modal : q.startsWith('#modal [') ? {focus:noop} : null
    },
    window: {screen: {width: 1000, height: 700}, scrollTo: noop},
    localStorage: {
      getItem: k => storage.get(k),
      setItem: (k, v) => storage.set(k, v),
      removeItem: k => storage.delete(k)
    },
    matchMedia: () => ({matches: true}), devicePixelRatio: 1,
    Image: class {}, innerWidth: 1000, innerHeight: 700, performance,
    requestAnimationFrame: noop, addEventListener: noop, setTimeout: queueMicrotask,
    clearTimeout: noop
  });
  const run = source => vm.runInContext(source, ctx);
  for(const file of ['assets/maps/act01/registry.js','src/act-map.js','assets/rigs/registry.js','assets/rigs/player.js'])
    run(fs.readFileSync(path.join(__dirname,'..',file),'utf8'));
  run(game);
  if (heroes) {
    run("Math.random=()=>0");
    if (heroes.length > 1) run(`A.party('${heroes.length}')`);
    else run('A.new()');
    for (const hero of heroes) {
      run(`A.hero('${hero}')`);
      if(heroes.length === 1) {
        run('A.begin()');
      } else if (hero === 'oath') run('A.oathstart()');
    }
    if (!leaveThreshold) {
      while (run('screen') === 'threshold') run("A.bless('merchant')");
    }
    if (leaveThreshold) return {run, storage};
    assert.equal(run('screen'), 'map');
  }
  return {run, storage};
}

test('enemy HP scales each spawn exactly once for solo through four seats', () => {
  for (const count of [1, 2, 3, 4]) {
    const {run} = launch(Array(count).fill('aether'));
    run("G.floor=11; Math.random=()=>0; startCombat(['tick','jugg','king'], 'fight')");
    assert.equal(run('JSON.stringify(C.foes.map(e=>[e.hp,e.max]))'),
      JSON.stringify([14, 117, 180].map(hp => [hp * count, hp * count])));
  }
});

test('two seats act before the enemy, which resolves each hit against personal block', async () => {
  const {run} = launch(['aether', 'oath']);
  run("startCombat(['scrap'], 'fight'); C.foes[0].int={a:4,x:2}; C.p.block=6");
  await run('A.end()');
  assert.equal(run('activeSeat()'), 1);
  assert.equal(run('G.hero'), 'oath');
  assert.equal(run('C.p.block'), 5, 'Oathbound retains their own opening relic');
  assert.equal(run('C.energy'), 3);
  assert.equal(run('C.foes[0].t'), 0);
  await run('A.end()');
  assert.equal(run('activeSeat()'), 0);
  assert.equal(run('partyMember(0).hp'), 68);
  assert.equal(run('partyMember(1).hp'), 77);
  assert.equal(run('C.foes[0].t'), 1);
});

test('a fallen player is skipped and surviving players can finish the round', async () => {
  const {run} = launch(['aether', 'aether']);
  run("startCombat(['scrap'], 'fight'); G.hp=1; C.foes[0].int={a:4,x:2}");
  await run('A.end()');
  await run('A.end()');
  assert.equal(run('screen'), 'combat');
  assert.equal(run('activeSeat()'), 1);
  assert.equal(run('partyMember(0).hp'), 0);
  assert.equal(run('G.hp'), 62);
  run('C.foes[0].int={a:99}');
  await run('A.end()');
  assert.equal(run('screen'), 'dead');
});

test('four-player enemy buffs and intents advance once while every player takes damage', async () => {
  const {run} = launch(Array(4).fill('aether'));
  run("startCombat(['king'], 'boss')");
  for (let seat = 0; seat < 4; seat++) {
    assert.equal(run('activeSeat()'), seat);
    await run('A.end()');
  }
  assert.equal(run('C.foes[0].st.str'), 2);
  assert.equal(run('C.foes[0].block'), 10);
  for (let seat = 0; seat < 4; seat++) await run('A.end()');
  for (let seat = 0; seat < 4; seat++) assert.equal(run(`partyMember(${seat}).hp`), 50);
  assert.equal(run('C.foes[0].t'), 2);
});

test('solo enemy damage and turn order remain unchanged', async () => {
  const {run} = launch(['aether']);
  run("startCombat(['rustjaw'], 'fight'); C.p.block=3");
  await run('A.end()');
  assert.equal(run('G.hp'), 67);
  assert.equal(run('C.turn'), 2);
  assert.equal(run('C.foes[0].t'), 1);
});

test('each player drafts their own reward and the shared map resumes from storage', () => {
  const solo = launch(['aether']);
  const {run, storage} = launch(['oath', 'aether'], solo.storage);
  run("A.previewNode('0,1');A.travel(); winCombat()");
  assert.equal(run('screen'), 'reward');
  assert.equal(run('activeSeat()'), 0);
  run("A.inspectreward('0');A.rcard(); A.map()");
  assert.equal(run('screen'), 'reward');
  assert.equal(run('activeSeat()'), 1);
  assert.equal(run('G.deck.length'), 10);
  run('A.map()');
  assert.equal(run('screen'), 'map');
  const resumed = launch(null, storage).run;
  resumed('A.contparty()');
  assert.equal(resumed('partySize()'), 2);
  assert.equal(resumed('JSON.stringify(G.path)'), '[[0,1]]');
  assert.equal(resumed('partyMember(0).hero'), 'oath');
  assert.equal(resumed('partyMember(0).deck.length'), 11);
  assert.equal(resumed('partyMember(1).hero'), 'aether');
  assert.equal(resumed('partyMember(1).deck.length'), 10);
  resumed('A.cont()');
  assert.equal(resumed('partySize()'), 1);
  assert.equal(resumed('G.floor'), 0, 'the separate solo run survives a party save');
});


test('each party member resolves a persisted Threshold before the shared map', () => {
  const {run,storage}=launch(['aether','oath'],new Map(),true);
  assert.equal(run('screen'),'threshold');
  assert.equal(run('JSON.stringify(G.party.map(p=>p.threshold.offers.length))'),'[3,3]');
  run("A.bless('tempered')");
  const pending=run('JSON.stringify(G.threshold.pending)');
  const resumed=launch(null,storage).run;
  resumed('A.contparty()');
  assert.equal(resumed('screen'),'threshold');
  assert.equal(resumed('JSON.stringify(G.threshold.pending)'),pending);
  resumed('resolveBlessing(G.threshold.pending.choices[0])');
  assert.equal(resumed('activeSeat()'),1);
  assert.equal(resumed('screen'),'threshold');
  resumed("A.bless('merchant')");
  assert.equal(resumed('screen'),'map');
  assert.equal(resumed('G.party.every(p=>p.threshold.applied)'),true);
  resumed("A.previewNode('0,0');A.travel();winCombat()");
  resumed('A.map();A.map();G.map[1][0].t="shop";A.previewNode("1,0");A.travel()');
  assert.equal(resumed('merchantPrice(100)'),100);
  resumed('A.map()');
  assert.equal(resumed('merchantPrice(100)'),70);
  resumed('A.map()');
  assert.equal(resumed('partyMember(1).threshold.merchantRemaining'),0);
});

test('solo Threshold resumes and combat blessings expire after three wins', () => {
  const {run, storage} = launch(null);
  run("A.new(); A.hero('aether'); A.begin()");
  assert.equal(run('screen'), 'threshold');
  const resumed = launch(null, storage).run;
  resumed('A.cont()');
  assert.equal(resumed('screen'), 'threshold');
  resumed("for(let seed=0;!G.threshold.offers.includes('first-light');seed++)newRunSeed('aether',seed); A.bless('first-light')");
  for (let i = 0; i < 4; i++) {
    resumed("startCombat(['scrap'], 'fight')");
    assert.equal(resumed('C.energy'), i < 3 ? 4 : 3);
    resumed('winCombat(); A.map()');
  }
});


test('victory weights follow the strongest defeated enemy and elite relics claim once', () => {
  for (const [foes,kind,roll,rarity] of [
    [['spore','tick'],'fight',0.65,1],
    [['tick','mask'],'fight',0.65,2],
    [['rustjaw'],'fight',0.93,3],
    [['warden'],'elite',0.80,3]
  ]) {
    const {run}=launch(['aether']);
    run(`startCombat(${JSON.stringify(foes)}, '${kind}'); Math.random=()=>${roll}; winCombat()`);
    assert.equal(run('K[RW.cards[0]].r'),rarity);
    assert.equal(run('new Set(RW.cards).size'),3);
    assert.equal(run('!!RW.relic'),kind==='elite');
    if(kind==='elite'){
      run('var dropped=RW.relic; A.rrelic(); A.rrelic()');
      assert.equal(run('G.relics.filter(id=>id===dropped).length'),1);
    }
  }
});

test('draft exhausts only unlocked cards and handles missing rarities', () => {
  const {run}=launch(['oath']);
  run("POOLS.oath={1:['warmonger'],2:['stoneshatter'],3:[]}; G.oaths=[]");
  assert.equal(run("cardChoices('elite').length"),0);
  run("G.oaths=['varran']");
  assert.equal(run("JSON.stringify(cardChoices('elite'))"),'["warmonger"]');
  run("G.oaths.push('orun')");
  assert.equal(run("cardChoices('elite').sort().join(',')"),'stoneshatter,warmonger');
});

test('combat gold pays five per kill with bounded bonuses for each encounter tier', () => {
  for(const [foes,kind,min,max] of [
    [['tick'],'fight',7,17], [['tick','mask'],'fight',12,22],
    [['warden'],'elite',25,35], [['king'],'boss',5,5]
  ]) for(const [roll,expected] of [[0,min],[0.999,max]]){
    const {run}=launch(['aether']);
    run(`startCombat(${JSON.stringify(foes)},'${kind}'); var before=G.gold;
      C.foes.forEach(e=>e.hp=0); Math.random=()=>${roll}; winCombat()`);
    assert.equal(run('G.gold-before'),expected);
    assert.equal(run('G.rewardAudit[0].killGold'),foes.length*5);
    assert.equal(run('G.rewardAudit[0].gold'),expected);
    assert.equal(run('JSON.stringify(G.rewardAudit[0].defeated)'),JSON.stringify(foes));
  }
});

test('party reward audit survives reload and tracks each personal claim once', () => {
  const first=launch(['oath','aether']);
  first.run("A.previewNode('0,1');A.travel();startCombat(['warden'],'elite');C.foes[0].hp=0; winCombat()");
  first.run("A.rrelic();A.inspectreward('0');A.rcard()");
  const {run}=launch(null,first.storage);
  run('A.contparty()');
  assert.equal(run('G.rewardAudit.length'),1);
  assert.equal(run('G.rewardAudit[0].chosenCard===G.rewardAudit[0].cards[0].id'),true);
  assert.equal(run('G.rewardAudit[0].claimedRelic===G.rewardAudit[0].relic'),true);
  run('A.map()');
  assert.equal(run('G.rewardAudit.map(a=>a.seat).join()'),'0,1');
  assert.equal(run('G.rewardAudit.every(a=>a.killGold===5)'),true);
});

test('seeded card reward audit covers both classes and every single and paired oath', t => {
  const {run}=launch(['aether']);
  const rows=run(`(()=>{
    Math.random=seedRng(32735);
    const gods=Object.keys(GODS);
    const profiles=[[],...gods.map(g=>[g]),...gods.flatMap((g,i)=>gods.slice(i+1).map(h=>[g,h]))];
    const rows=[];
    for(const hero of ['aether','oath'])for(const oaths of hero==='oath'?profiles:[[]]){
      G.hero=hero;G.oaths=oaths;
      const eligible=new Set([...POOL[1],...POOL[2],...POOL[3]]);
      for(const tier of ['common','uncommon','elite']){
        let rareOffers=0,higherOffers=0;
        const slots=[0,0,0],seen=new Set();
        for(let i=0;i<5000;i++){
          const ids=cardChoices(tier);
          if(ids.length!==3||new Set(ids).size!==3||ids.some(id=>!eligible.has(id)))throw Error('Invalid draft '+hero+' '+oaths+' '+tier);
          for(const id of ids){slots[K[id].r-1]++;seen.add(id)}
          rareOffers+=Number(ids.some(id=>K[id].r===3));
          higherOffers+=Number(ids.some(id=>K[id].r>=2));
        }
        rows.push({hero,oaths,tier,slots,rareOffers,higherOffers,seen:seen.size,pool:eligible.size,weights:CARD_REWARD_WEIGHTS[tier]});
      }
    }
    return rows
  })()`);
  for(const row of rows){
    assert.equal(row.seen,row.pool,'all eligible cards appeared');
    for(const [i,count] of row.slots.entries())assert.ok(Math.abs(count/15000-row.weights[i]/100)<0.025,JSON.stringify(row));
  }
  for(const tier of ['common','uncommon','elite']){
    const subset=rows.filter(row=>row.tier===tier);
    const pct=key=>(subset.reduce((sum,row)=>sum+row[key],0)/subset.length/50).toFixed(1)+'%';
    t.diagnostic(tier+' | offers: '+subset.length*5000+' | at least one rare: '+pct('rareOffers')+' | uncommon or rare: '+pct('higherOffers'));
  }
});

test('reward audit distinguishes an open offer, a pick and a skipped offer by seat', () => {
  const {run}=launch(['aether','oath']);
  run("startCombat(['warden'],'elite');C.foes[0].hp=0;winCombat()");
  assert.equal(run('G.rewardAudit[0].cardOutcome'),'pending');
  run("A.inspectreward('0');A.rcard();A.rrelic();A.map();A.map()");
  assert.equal(run("G.rewardAudit.map(a=>a.cardOutcome+'/'+a.relicOutcome).join(',')"),'picked/claimed,skipped/skipped');
  assert.equal(run('G.rewardAudit.every(a=>a.eligibleByRarity.length===3)'),true);
});

test('rare decision report separates observed picks, skips, pending offers and missing legacy outcomes', () => {
  const {run}=launch(['aether']);
  const report=JSON.parse(run(`(()=>{
    const cards=[{id:'r',rarity:3},{id:'c',rarity:1}];
    const records=[
      {tier:'elite',cards,chosenCard:'r'}, {tier:'elite',cards,chosenCard:'c'},
      {tier:'elite',cards,cardOutcome:'skipped'}, {tier:'elite',cards,ascendedCard:'upgraded'},
      {tier:'common',cards,cardOutcome:'pending'}, {tier:'common',cards},
      {tier:'common',cards:[{id:'c',rarity:1}],chosenCard:'c'}
    ];
    return JSON.stringify(summarizeRareOffers(records));
  })()`));
  assert.deepEqual(report.total,{offers:6,resolved:4,rarePicked:1,lowerRarityPicked:1,skipped:1,ascended:1,pending:1,unknown:1,rarePickRate:0.25});
  assert.equal(report.byEncounter.common.rarePickRate,null);
  assert.equal(report.byEncounter.elite.resolved,4);
  assert.equal(run("screen='dead';G.rewardAudit=[{}];endV().includes('data-a=\"rewardreport\"')"),true);
});
