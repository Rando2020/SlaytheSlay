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
  const markup=vm.runInContext('handV()',ctx);
  const offsets=[...markup.matchAll(/--offset:([-\d.]+);--gaps:(\d+)/g)];
  const handWidth=Math.min(width,1120),cardWidth=width<=600?112:148;
  const lefts=offsets.map(([,offset,gaps])=>handWidth/2-cardWidth/2+Number(offset)*Math.min(cardWidth+10,(handWidth-cardWidth-68)/Number(gaps)));
  assert.equal(lefts.length,count);
  assert.ok(lefts[0]>=0);assert.ok(lefts.at(-1)+cardWidth<=handWidth);
  if(count===10)assert.ok(lefts[0]>=34,'leave room for rotated corners and cost badges');
  assert.ok(Math.abs((lefts[0]+lefts.at(-1)+cardWidth)/2-handWidth/2)<1,'fan centered in viewport hand');
 }
});

test('combat overlays keep modals above controls and preserve painted sprite proportions',()=>{
 const css=html.match(/<style>([\s\S]*?)<\/style>/)[1];
 const z=selector=>Number([...css.matchAll(/([^{}]+)\{([^{}]+)\}/g)].filter(m=>m[1].trim()===selector&&/z-index:/.test(m[2])).at(-1)?.[2].match(/z-index:(\d+)/)?.[1]);
 assert.ok(z('.modal')>z('#app>.ctl'),'deck and card-choice modal must cover combat controls');
 assert.doesNotMatch(css,/#app>\.stage \.unit:not\(\.hero\) \.spr\{/,'generic sprite dimensions must exclude painted enemies');
});
