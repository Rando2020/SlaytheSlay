from pathlib import Path
s=Path('index.html').read_text(encoding='utf-8').replace('<head>','<head><base href="/">',1)
api='''window.mapQA={start:h=>{newRun(h);delete G.threshold;goMap()},partyFixture:t=>{openPartySetup(2);chooseClimber("aether");chooseClimber("oath");G.party.forEach(p=>delete p.threshold);goMap();G.map[0][0].t=t;save()},sharedFoes:()=>combatParty.every(c=>c.foes===C.foes),state:()=>JSON.parse(JSON.stringify({G,C,RW,SH,RS,SR,EV:EV?{index:EVENTS.indexOf(EV.e),done:EV.done,msg:EV.msg}:null,screen,uid})),select:k=>{selectedNode=k},confirm:travel,continue:()=>A.cont(),map:goMap,save,action:(k,v)=>A[k](v),fixture:(t)=>{mapQA.start('oath');G.map[0][0].t=t;save();},victory:()=>{C.foes.forEach(e=>e.hp=0);C.lock=false;render();checkWin()},mutateBusy:()=>{C.busy=true;C.energy=0;C.lock=true;save()},win:winCombat};'''
s=s.replace('setZoom();let rz;',api+'\nsetZoom();let rz;')
Path('output/map-qa.html').write_text(s,encoding='utf-8')
