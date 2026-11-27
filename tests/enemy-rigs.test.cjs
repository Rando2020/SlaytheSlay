const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const base=path.resolve(__dirname,'..');
const ctx=vm.createContext({});
for(const name of ['registry','player'])vm.runInContext(fs.readFileSync(path.join(base,'assets/rigs',name+'.js'),'utf8'),ctx);
const {registry,player}=vm.runInContext('({registry:EnemyRigData,player:EnemyRigs})',ctx);
for(const [key,rig] of Object.entries(registry)){
 test(key+' resolves all attachments and states',()=>{
  assert.ok(player.templates[rig.template]);
  for(const layer of rig.layers){
   assert.ok(fs.existsSync(path.join(base,'assets/enemies',key,layer.file+'.webp')));
   assert.ok(rig.bones[layer.bone]);
   assert.ok(layer.rect.every(Number.isFinite)&&layer.rect.slice(2).every(n=>n>0));
  }
  for(const state of Object.keys(player.durations)){
   for(let i=0;i<=20;i++){
    const p=i/20,result=player.pose(rig,state,p,p*player.durations[state]);
    assert.ok(Object.values(result.matrices).flat().every(Number.isFinite));
    assert.ok(result.opacity>=0&&result.opacity<=1);
    if(!rig.spear)continue;
    for(const arm of rig.spear.arms){
     const target=player.point(result.matrices[rig.spear.bone],arm.socket);
     const wrist=player.point(result.matrices[arm.lower],arm.socket);
     assert.ok(Math.hypot(target[0]-wrist[0],target[1]-wrist[1])<.01,'detached wrist '+state+' '+p);
    }
   }
  }
 });
}
