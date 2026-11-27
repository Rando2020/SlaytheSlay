const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.join(__dirname, '..');
const ctx = vm.createContext({document:{addEventListener(){}}});
for (const name of ['assets/maps/act01/registry.js','src/act-map.js']) {
  vm.runInContext(fs.readFileSync(path.join(root,name),'utf8'),ctx);
}
const map = vm.runInContext('ActMap',ctx);

test('every registered map asset ships in the static build', () => {
  for (const group of Object.values(map.act.art)) {
    for (const file of Object.values(group)) assert.ok(fs.statSync(path.join(root,map.act.root,file)).size);
  }
});
test('1,000 seeds per class reproduce legal routes from every room to the boss', () => {
  for (const hero of ['oath','aether']) for (let seed=0;seed<1000;seed++) {
    const floors = map.generate(hero,seed);
    assert.deepEqual(floors,map.generate(hero,seed));
    assert.equal(floors.length,13);
    assert.equal(floors[12][0].t,'boss');
    floors.slice(0,-1).forEach((row,f)=>{
      const incoming = new Set();
      row.forEach((node,l)=>{
        assert.ok(node.next.length);
        assert.ok(map.act.encounters[node.t]);
        if (f===0) assert.equal(node.t,'fight');
        if (f===6) assert.equal(node.t,'chest');
        if (f===11) assert.equal(node.t,'rest');
        if (f===2 && hero==='oath') assert.equal(node.t,'shrine');
        for (const dest of node.next) {
          assert.ok(floors[f+1][dest]);
          if (dest===l+1) assert.ok(!row[dest].next.includes(l));
          incoming.add(dest);
        }
      });
      assert.equal(incoming.size,floors[f+1].length);
    });
  }
});
test('legacy run round trip preserves graph, selection eligibility and rendering',()=>{
  const run = {hero:'oath', map:map.generate('oath',17), pos:{f:0,l:1},path:[[0,1]]};
  const restored = JSON.parse(JSON.stringify(run));
  const first = map.available(restored)[0].join();
  const html = map.render(restored,first);
  assert.equal(html,map.render(run,first));
  assert.match(html,/data-a="travel"/);
  assert.equal((html.match(/class="preview-path"/g)||[]).length,1);
  assert.doesNotMatch(map.render(run,'12,0'),/class="preview-path"|node  selected/);
  const start = {...run,pos:null,path:[]};
  assert.match(map.render(start,'0,2'),/class="preview-path"/);
  assert.doesNotMatch(map.render(start,null),/class="preview-path"/);
  assert.doesNotMatch(map.render(run,'12,0'),/data-a="travel"/);
  assert.equal((html.match(/data-a="previewNode"/g)||[]).length,run.map[0][1].next.length);
});

test('four-room streaks remain possible but rare on connected routes', () => {
  const mapsWithFour = {rest: 0, event: 0};
  for (const hero of ['aether','oath']) for (let seed=0; seed<5000; seed++) {
    let parents = [];
    const seen = new Set();
    for (const row of map.generate(hero,seed)) {
      parents = row.map((node,lane) => {
        const matching = parents.filter(p => p.t === node.t && p.next.includes(lane));
        const length = 1 + Math.max(0,...matching.map(p => p.length));
        if (length >= 4) seen.add(node.t);
        return {...node,length};
      });
    }
    for (const type of Object.keys(mapsWithFour)) if (seen.has(type)) mapsWithFour[type]++;
  }
  for (const [type,count] of Object.entries(mapsWithFour)) {
    assert.ok(count > 0 && count < 50, `${type}: ${count} of 10,000 maps`);
  }
});
