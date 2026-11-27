const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
test('selection scene and every hero pose ship with the static game',()=>{
 const selection=html.match(/\/\* Oathbound class selection:[\s\S]*?(?=\.pick\{)/)[0];
 const heroes=[...html.match(/const HEROES=\{([^\n]*\n[^\n]*)/)[1].matchAll(/(?:^|\n)(\w+):\{n:/g)].map(m=>m[1]);
 const posesList=JSON.parse(html.match(/const HERO_POSES=(\[[^\]]*\])/)[1].replace(/'/g,'"'));
 assert.deepEqual(heroes.sort(),['aether','oath']);
 const poses=heroes.flatMap(h=>posesList.map(p=>`assets/heroes/${h}/${p}.webp`));
 const urls=[...[...selection.matchAll(/url\((assets\/[^)]+)\)/g)].map(m=>m[1]),...poses];
 for(const url of urls) assert.ok(fs.existsSync(path.join(root,url)),`Missing deployed asset: ${url}`);
});
test('both registered classes start with their existing stats, deck and relic',()=>{
 const heroes=html.match(/const HEROES=([\s\S]*?);/)[0];
 const start=html.match(/function newRun\(h\)\{[^\n]+\nfunction newRunSeed\(h,seed\)\{[^\n]+/)[0];
 const ctx=vm.createContext({START_GOLD:99,mk:id=>({id}),genMap:h=>({hero:h}),newSeed:()=>1,seedRng:()=>()=>0,initThreshold:()=>{},save:()=>{},render:()=>{}});
 vm.runInContext('let uid=0,G=null,C=null,screen="title";'+heroes+start,ctx);
 for(const [hero,hp,relic] of [['oath',80,'unbroken'],['aether',70,'heart']]){
  vm.runInContext(`newRun('${hero}')`,ctx);
  const state=vm.runInContext('JSON.stringify(G)',ctx);const g=JSON.parse(state);
  assert.equal(g.hero,hero);assert.equal(g.hp,hp);assert.equal(g.maxHp,hp);assert.equal(g.gold,99);
  assert.deepEqual(g.relics,[relic]);assert.equal(g.deck.length,10);assert.deepEqual(g.oaths,[]);
  if(hero==='oath')assert.deepEqual(g.deck.map(c=>c.id),['strike','strike','strike','strike','guard','guard','guard','judgment','lay','invoke']);
 }
 vm.runInContext('newRun()',ctx);assert.equal(vm.runInContext('screen',ctx),'pick');
});

test('hero image requests opt into CORS before loading WebGL textures',()=>{
 const load=html.match(/function rigLoad\(\)\{[^\n]+/)[0];
 const requests=[];
 class ImageRequest {set src(value){requests.push({src:value,crossOrigin:this.crossOrigin})}}
 const ctx=vm.createContext({PSET:{oath:{idle:'assets/heroes/oath/idle.webp'},aether:{idle:'assets/heroes/aether/idle.webp'}},Image:ImageRequest});
 vm.runInContext(load+';rigLoad()',ctx);
 assert.equal(requests.length,2);
 for(const r of requests)assert.equal(r.crossOrigin,'anonymous',r.src+' must remain usable by WebGL after CDN redirects');
});
