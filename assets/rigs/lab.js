(() => {
  const ui=Object.fromEntries([...document.querySelectorAll('[id]')].map(el=>[el.id,el]));
  const add=(select,value,label)=>select.add(new Option(label,value));
  for(const [key,rig] of Object.entries(EnemyRigData))add(ui.enemy,key,rig.name);
  for(const state of Object.keys(EnemyRigs.durations))add(ui.state,state,state);
  let rig,draw,marker,time=0,last=0,playing=!matchMedia('(prefers-reduced-motion:reduce)').matches,show=false;
  const duration=()=>EnemyRigs.durations[ui.state.value];
  const storage=()=>'hollow-ascent.rig.v1.'+ui.enemy.value;
  function syncBone(){
    const id=ui.bone.value;
    ui.angle.value=rig.bones[id].angle||0;
    ui.angle.disabled=!!rig.spear && [rig.spear.bone,...rig.spear.arms.flatMap(a=>[a.upper,a.lower])].includes(id);
    ui.degrees.value=ui.angle.value+'°';
  }
  function select(){
    const key=ui.enemy.value;rig=structuredClone(EnemyRigData[key]);
    try{
      const edits=JSON.parse(localStorage.getItem(storage())||'{}');
      for(const [id,angle] of Object.entries(edits))if(Object.hasOwn(rig.bones,id)&&Number.isFinite(angle)&&Math.abs(angle)<=45)rig.bones[id].angle=angle;
    }catch{}
    draw=EnemyRigs.build(ui.rig,key,rig);
    marker=document.createElementNS('http://www.w3.org/2000/svg','circle');
    marker.setAttribute('r',4);marker.setAttribute('class','joint');ui.rig.append(marker);
    ui.bone.replaceChildren();for(const id of Object.keys(rig.bones))add(ui.bone,id,id);
    ui.nameplate.textContent=rig.name;ui.status.textContent='';syncBone();time=0;paint();
  }
  function paint(){
    const phase=time/duration(),matrices=draw(ui.state.value,phase,time,+ui.gain.value);
    const id=ui.bone.value,[x,y]=EnemyRigs.point(matrices[id],rig.bones[id].pivot);
    marker.setAttribute('cx',x);marker.setAttribute('cy',y);marker.style.display=show?'':'none';
    ui.timeline.value=Math.round(phase*1000);ui.clock.value=(time/1000).toFixed(2)+' s';
    ui.play.textContent=playing?'Pause':'Play';
  }
  function tick(now){if(playing){time=(time+Math.min(now-last,100)*Number(ui.speed.value))%duration();paint()}last=now;requestAnimationFrame(tick)}
  ui.angle.oninput=()=>{
    rig.bones[ui.bone.value].angle=+ui.angle.value;syncBone();paint();
    const edits=Object.fromEntries(Object.entries(rig.bones).filter(([,b])=>b.angle).map(([id,b])=>[id,b.angle]));
    try{localStorage.setItem(storage(),JSON.stringify(edits));ui.status.textContent='Draft saved on this device.'}catch{ui.status.textContent='Export JSON to keep this draft.'}
  };
  ui.enemy.onchange=select;ui.state.onchange=()=>{time=0;paint()};
  ui.bone.onchange=()=>{syncBone();paint()};ui.gain.oninput=paint;
  ui.play.onclick=()=>{playing=!playing;paint()};
  ui.timeline.oninput=()=>{playing=false;time=duration()*ui.timeline.value/1000;paint()};
  ui.joints.onclick=()=>{show=!show;ui.joints.setAttribute('aria-pressed',show);ui.joints.textContent=show?'Hide pivots':'Show pivots';paint()};
  ui.reset.onclick=()=>{try{localStorage.removeItem(storage())}catch{}select()};
  ui.save.onclick=()=>{
    const url=URL.createObjectURL(new Blob([JSON.stringify(rig,null,2)],{type:'application/json'}));
    const link=document.createElement('a');link.href=url;link.download=ui.enemy.value+'.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  };
  select();requestAnimationFrame(tick);
})();
