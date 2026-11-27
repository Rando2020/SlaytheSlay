from pathlib import Path
s=Path('index.html').read_text(encoding='utf-8').replace('<head>','<head><base href="/">',1)
api='''window.mapQA={start:h=>newRun(h),state:()=>JSON.parse(JSON.stringify({G,C,RW,SH,RS,SR,EV:EV?{index:EVENTS.indexOf(EV.e),done:EV.done,msg:EV.msg}:null,screen,uid})),select:k=>{mapSelected=k},confirm:confirmMapTravel,finish:finishMapTravel,continue:()=>A.cont(),map:goMap,save,action:(k,v)=>A[k](v),fixture:(t)=>{newRun('oath');G.map[0][0].t=t;save();},victory:()=>{C.foes.forEach(e=>e.hp=0);C.lock=false;render();checkWin()},mutateBusy:()=>{C.busy=true;C.energy=0;C.won=true;C.foes.forEach(e=>e.hp=0);save()},win:winCombat};'''
s=s.replace('setZoom();let rz;',api+'\nsetZoom();let rz;')
Path('output/map-qa.html').write_text(s,encoding='utf-8')
