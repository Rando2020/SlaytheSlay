// Bone pivots and sprite rectangles use the same rest-space coordinates.
// Accumulating parent matrices keeps draw order independent of bone order.
const EnemyRigs = (() => {
  const templates = {
    floating: {travel: .12, lean: 9, lift: .022},
    creature: {travel: .17, lean: 13, lift: .007},
    construct: {travel: .075, lean: 6, lift: .003},
    humanoid: {travel: .11, lean: 8, lift: .005}
  };
  const durations = {idle: 2400, attack: 440, charge: 780, defend: 620, hit: 340, death: 790};
  // Rotation, period in seconds, and vertical travel in rig-height units.
  const secondary = {
    breathe:[0,3,.005], sway:[3,3,0], sway2:[-3,3.6,0], hair:[4,3.4,0],
    nod:[2,2.8,0],claw:[3,2.9,0],claw2:[-3,3.4,0],leg:[1.5,3,0],
    leg2:[-1.5,3,0],chew:[4,1.5,0],cap:[2,2.7,0],glow:[.6,2.4,0],
    pulse:[1.5,2.2,.002],hover:[1.4,3.7,.009],flick:[2,2.3,.002],
    flick2:[-2,2.6,.002],drift:[5,3.6,.012],drift2:[-4,4.2,.015],drift3:[3,5,.016]
  };
  const ns='http://www.w3.org/2000/svg';
  const rad=Math.PI/180;
  function local([x,y], angle, dx=0,dy=0) {
    const c=Math.cos(angle*rad),s=Math.sin(angle*rad);
    return [c,s,-s,c,x-c*x+s*y+dx,y-s*x-c*y+dy];
  }
  function combine([a,b,c,d,x,y],[e,f,g,h,u,v]) {
    return [a*e+c*f,b*e+d*f,a*g+c*h,b*g+d*h,a*u+c*v+x,b*u+d*v+y];
  }
  function point([a,b,c,d,x,y],[u,v]) {return [a*u+c*v+x,b*u+d*v+y];}
  function pose(rig,state,t,time,gain=1) {
    const [w,h]=rig.size, style=templates[rig.template], matrices={};
    const p=Math.min(1,Math.max(0,t)), wave=Math.sin(Math.PI*p);
    let lean=0,x=0,y=0,opacity=1;
    if(state==='attack'){
      const thrust=p<.25?-Math.sin(Math.PI*p/.5)*.24:Math.sin(Math.PI*(p-.25)/.75);
      x=-w*style.travel*thrust;lean=-style.lean*thrust;
    }else if(state==='hit'){x=w*.07*wave;lean=style.lean*wave;}
    else if(state==='charge'){lean=style.lean*.65*wave;y=h*.035*wave;}
    else if(state==='defend'){lean=-style.lean*.45*wave;y=h*.055*wave;}
    else if(state==='death'){lean=24*p*p;y=h*.16*p*p;opacity=1-p*p;}
    const oscillation=Math.sin(time/460);
    y+=style.lift*h*oscillation*gain*(state==='death'?1-p:1);
    const overrides=rig.spear?solveSpear(rig,state,wave):{};
    let i=0;
    function visit(id){
      if(matrices[id])return matrices[id];
      const bone=rig.bones[id], parent=bone.parent?visit(bone.parent):null;
      const motion=secondary[bone.motion], phase=motion?Math.sin(time/1000*2*Math.PI/motion[1]+i*.79)*gain:0;
      i++;
      let angle=(bone.angle||0)+(motion?motion[0]*phase:0);
      if(state==='attack' && ['claw','chew','nod'].includes(bone.motion))angle-=9*wave;
      if(state==='defend' && bone.motion==='claw')angle+=8*wave;
      const own=overrides[id]||local(bone.pivot,angle+(parent?0:lean),parent?0:x,(parent?0:y)+(motion?motion[2]*h*phase:0));
      return matrices[id]=parent?combine(parent,own):own;
    }
    Object.keys(rig.bones).forEach(visit);
    return {matrices,opacity};
  }
  // Each arm targets a socket in the moving spear's frame. The elbow
  // side is authored so the two gauntlets keep their individual silhouettes.
  function solveSpear(rig,state,wave) {
    const spec=rig.spear;
    const angle=({attack:-24,defend:12,charge:9,hit:6}[state]||0)*wave;
    const weapon=local(rig.bones[spec.bone].pivot,angle);
    const transforms={[spec.bone]:weapon};
    const direction=(x,y)=>Math.atan2(y,x)/rad;
    for(const arm of spec.arms){
      const a=rig.bones[arm.upper].pivot,b=rig.bones[arm.lower].pivot,c=arm.socket;
      const target=point(weapon,c),dx=target[0]-a[0],dy=target[1]-a[1];
      const len=Math.hypot(dx,dy),l1=Math.hypot(b[0]-a[0],b[1]-a[1]),l2=Math.hypot(c[0]-b[0],c[1]-b[1]);
      const along=(len*len+l1*l1-l2*l2)/(2*len);
      const side=arm.bend*Math.sqrt(Math.max(0,l1*l1-along*along));
      const ex=a[0]+(along*dx-side*dy)/len,ey=a[1]+(along*dy+side*dx)/len;
      const upper=direction(ex-a[0],ey-a[1])-direction(b[0]-a[0],b[1]-a[1]);
      const lower=direction(target[0]-ex,target[1]-ey)-direction(c[0]-b[0],c[1]-b[1]);
      transforms[arm.upper]=local(a,upper);
      transforms[arm.lower]=local(b,lower-upper);
    }
    return transforms;
  }
  function element(tag,attrs) {
    const el=document.createElementNS(ns,tag);
    for(const [k,v] of Object.entries(attrs))el.setAttribute(k,v);
    return el;
  }
  function build(svg,key,rig=EnemyRigData[key]){
    svg.replaceChildren();svg.setAttribute('viewBox','0 0 '+rig.size.join(' '));
    const layers=rig.layers.map(({file,bone,rect})=>{
      const [x,y,width,height]=rect;
      const el=element('image',{href:'assets/enemies/'+key+'/'+file+'.webp',x,y,width,height});
      svg.append(el);return {el,bone};
    });
    return (state,t,time,gain)=>{
      const {matrices,opacity}=pose(rig,state,t,time,gain);
      for(const {el,bone} of layers)el.setAttribute('transform','matrix('+matrices[bone].join(' ')+')');
      svg.style.opacity=opacity;
      return matrices;
    };
  }
  const cues=new WeakMap(),actors=new Map();
  let frame=0;
  function tick(now){
    frame=0;
    if(!actors.size)return;
    const reduced=matchMedia('(prefers-reduced-motion:reduce)').matches;
    for(const [e,draw] of actors){
      const cue=cues.get(e),elapsed=cue?now-cue.start:0;
      const state=cue&&(elapsed<durations[cue.state]||cue.state==='death')?cue.state:'idle';
      draw(reduced?'idle':state,elapsed/durations[state],now+e.i*370,reduced?0:1);
    }
    if(!reduced)frame=requestAnimationFrame(tick);
  }
  return {templates,durations,pose,build,point,
    cue(e,state){cues.set(e,{state,start:performance.now()});},
    mount(svg,key,e){actors.set(e,build(svg,key));if(!frame)tick(performance.now());},
    clear(){actors.clear();cancelAnimationFrame(frame);frame=0;}
  };
})();
