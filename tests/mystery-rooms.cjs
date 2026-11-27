const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
for (const [,script] of html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)) new vm.Script(script);
const context = vm.createContext({});
vm.runInContext(html.match(/const seedRng=[^\n]+/)[0] + '\n' +
  html.slice(html.indexOf('const MYSTERY_TIERS='), html.indexOf('/* ---------- views ---------- */')) +
  `\nvar G;
  function reset(seed, elite, portrait) {
    G={seed, path:[[0,0],[1,0]], map:[[{t:elite?'elite':'fight'}]], choirPortrait:portrait};
  }
  function draw(seed,f,elite,portrait){
    reset(seed,elite,portrait);
    return drawMysteryRoom(f,0).rarity;
  }`, context);
const run = code => vm.runInContext(code, context);
const {draw,reset,drawMysteryRoom} = context;
for (const [floor, weights] of [[0,[65,28,6,0,1]],[4,[50,32,14,2,2]],[8,[40,34,19,4,3]]]) {
  const tiers=['common','uncommon','rare','legendary','unique'];
  const counts=Object.fromEntries(tiers.map(tier=>[tier,0]));
  for(let seed=0;seed<12000;seed++) counts[draw(seed,floor,true,true)]++;
  tiers.forEach((tier,i)=>assert.ok(Math.abs(counts[tier]/120-weights[i])<1.5,tier+' floor '+floor));
}
for(let seed=0;seed<500;seed++) {
  assert.ok(!['legendary','unique'].includes(draw(seed,9,false,false)));
  reset(seed,true,true);
  const seen=[];
  for(let i=0;i<40;i++){
    const snapshot=JSON.stringify(context.G);
    const room=drawMysteryRoom(9,i%3).id;
    context.G=JSON.parse(snapshot);
    assert.equal(drawMysteryRoom(9,i%3).id,room);
    assert.notEqual(seen.at(-1),room);
    seen.push(room);
  }
  assert.ok(seen.filter(id=>id==='missing-procession').length<=1);
}
reset(42,false,false);
run("G.gold=0;EVENTS.find(e=>e.id==='carbon-choir').o[1].f()");
assert.equal(context.G.gold,12);
assert.equal(run("EVENTS.find(e=>e.id==='missing-procession').unlock()"),true);
context.G.mysteryHistory=['The Carbon Choir'];
assert.notEqual(drawMysteryRoom(6,0).id,'carbon-choir');
assert.equal(context.G.mysteryHistory[0],'carbon-choir');
console.log('Mystery room rarity, unlock, persistence and repeat checks passed.');
