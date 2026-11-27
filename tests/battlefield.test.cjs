const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const html=fs.readFileSync(require('node:path').join(__dirname,'../index.html'),'utf8');
const source=html.match(/function handV\(\)\{[\s\S]*?(?=function combatV)/)[0];
test('combat fan uses viewport space and keeps up to ten cards within the hand',()=>{
 for(const width of [390,1280,1920])for(const count of [1,5,10]){
  const ctx=vm.createContext({innerWidth:width,$:()=>({clientWidth:900}),C:{hand:Array.from({length:count},()=>({})),sel:-1},performance:{now:()=>1000},RM:true,playable:()=>true,cardV:(c,attrs)=>attrs});
  vm.runInContext(source,ctx);
  const lefts=[...vm.runInContext('handV()',ctx).matchAll(/left:([\d.]+)px/g)].map(m=>+m[1]);
  const handWidth=Math.min(width,1120),cardWidth=width<604?98:128;
  assert.equal(lefts.length,count);
  assert.ok(lefts[0]>=0);assert.ok(lefts.at(-1)+cardWidth<=handWidth);
  if(count===10)assert.ok(lefts[0]>=50,'leave room for rotated corners and cost badges');
  assert.ok(Math.abs((lefts[0]+lefts.at(-1)+cardWidth)/2-handWidth/2)<1,'fan centered in viewport hand');
 }
});
