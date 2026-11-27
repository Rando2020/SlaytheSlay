const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
test('every combat area loads an extended courtyard at both resolutions',()=>{
 const code=html.match(/const HI=[^\n]+/)[0];
 for(const width of [1280,3840]){
  const ctx=vm.createContext({window:{screen:{width,height:720}},devicePixelRatio:1});
  const paths=vm.runInContext(code+';BGS',ctx);
  assert.deepEqual(Array.from(paths).map(p=>p.replace(/_4k/,'')),['assets/bg_ruins_overhead.webp','assets/bg_tree_overhead.webp','assets/bg_gate_overhead.webp']);
  const biomeCode=html.match(/const biome=[^\n]+/)[0];
  vm.runInContext(biomeCode,ctx);
  for(const floor of [1,4,5,9,10,13])assert.equal(vm.runInContext(`biome(${floor})`,ctx),floor>=10?2:floor>=5?1:0);
  for(const asset of paths)assert.ok(fs.existsSync(path.join(root,asset)),asset);
 }
});
