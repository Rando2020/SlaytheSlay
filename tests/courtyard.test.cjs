const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
test('normal and high resolution opening combat load the extended courtyard',()=>{
 const code=html.match(/const HI=[^\n]+/)[0];
 for(const width of [1280,3840]){
  const ctx=vm.createContext({window:{screen:{width,height:720}},devicePixelRatio:1});
  const paths=vm.runInContext(code+';BGS',ctx);
  assert.match(paths[0],/bg_ruins_courtyard/);
  for(const asset of paths)assert.ok(fs.existsSync(path.join(root,asset)),asset);
 }
});
