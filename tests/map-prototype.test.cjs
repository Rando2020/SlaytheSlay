const {test}=require('node:test');
const assert=require('node:assert/strict');
const M=require('../js/act-map.js');
test('1000 seeds per hero are deterministic, connected and honor encounter rules',()=>{
 for(const hero of ['aether','oath'])for(let seed=0;seed<1000;seed++){
  const a=M.generate(hero,String(seed));
  assert.deepEqual(a,M.generate(hero,String(seed)));
  assert.deepEqual(M.validate(a,hero),[]);
  assert.equal(a.length,13);assert.equal(a[12][0].t,'boss');
  assert.ok(a[0].every(n=>n.t==='fight'));
  assert.ok(a[11].every(n=>n.t==='rest'));
  assert.ok(a[6].every(n=>n.t==='chest'));
  if(hero==='oath')assert.ok(a[2].every(n=>n.t==='shrine'));
 }
});
test('variable widths, distributions and prerequisites are validated',()=>{
 for(let s=0;s<100;s++)assert.deepEqual(M.validate(M.generate('aether',s,{floors:9,minNodes:2,maxNodes:5,branching:1}),'aether'),[]);
 assert.throws(()=>M.generate('aether',1,{floors:2}));
 assert.throws(()=>M.generate('aether',1,{weights:{forge:1}}));
 const m=M.generate('aether',1);m[0][0].next=[];assert.ok(M.validate(m,'aether').length);
});
test('travel commits only a reachable destination and repeated confirmation is idempotent',()=>{
 const g={map:M.generate('aether',1),pos:null,path:[],floor:0};
 assert.equal(M.prepareTravel(g,9,0),null);
 const p=M.prepareTravel(g,0,0);assert.ok(p);assert.equal(g.floor,0);
 assert.equal(M.prepareTravel(g,0,1),null);
 assert.equal(M.commitTravel(g),true);assert.equal(M.commitTravel(g),false);
 assert.deepEqual(g.path,[[0,0]]);assert.equal(g.floor,1);
});
test('presentation keeps danger independent and unknown preview generic',()=>{
 const g={map:M.generate('aether',1),pos:null,path:[],floor:0};
 g.map[0][0].t='elite';
 const html=M.render(g,{selected:'0,0',icons:{elite:'<path/>'}});
 assert.match(html,/selected dangerous/);assert.match(html,/aria-pressed="true"/);
 assert.equal(M.describe('event').detail,'An unknown encounter. Discover what awaits when you arrive.');
 assert.doesNotMatch(M.render(g,{}),/undefined/);
});

test('both region configurations pass 1000 seeds and maintain 48px separation',()=>{
 for(const region of Object.values(M.registry.regions))for(let seed=0;seed<1000;seed++){
  const m=M.generate('oath',seed,region.generation);assert.deepEqual(M.validate(m,'oath',region.generation),[]);
  const geo=M.geometry(m),width=Math.max(300,(Math.max(...m.map(r=>r.length))+1)*58);
  m.forEach((row,f)=>row.slice(1).forEach((_,l)=>assert.ok((geo.xy(f,l+1)[0]-geo.xy(f,l)[0])*width/geo.width>=48)));
 }
});
