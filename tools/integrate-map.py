from pathlib import Path
p=Path('index.html');s=p.read_text(encoding='utf-8')
s=s.replace('</head>','<link rel="stylesheet" href="map.css"><script src="js/map-assets.js"></script><script src="js/act-map.js"></script></head>',1)
s=s.replace("const save=()=>{try{localStorage.setItem(SAVE,JSON.stringify(G))}catch(e){}};",'''let saveError=false;
function save(){try{if(G&&['combat','reward','shop','rest','shrine','event'].includes(screen)&&(!C||(!C.busy&&!C.lock))){G.encounter={screen,C,RW,SH,RS,SR,EV:EV?{index:EVENTS.indexOf(EV.e),done:EV.done,msg:EV.msg}:null,uid};}localStorage.setItem(SAVE,JSON.stringify(G));saveError=false;return true}catch(e){saveError=true;return false}}
function showSaveError(){if(!document.querySelector('.map-save-error')){const e=document.createElement('p');e.className='map-save-error';e.setAttribute('role','alert');e.textContent='Your progress could not be saved. Free browser storage before confirming travel.';document.body.append(e)}}
let mapSelected='',mapEffects=true,mapScroll=null,travelBusy=false;
function restoreEncounter(){const e=G.encounter;if(!e)return false;({C,RW,SH,RS,SR}=e);EV=e.EV?{...e.EV,e:EVENTS[e.EV.index]}:null;uid=e.uid||uid;if(C){C.busy=false;C.lock=false;C.sel=-1;}screen=e.screen;render();return true}
async function confirmMapTravel(){if(travelBusy||screen!=='map'||!mapSelected)return;const [f,l]=mapSelected.split(',').map(Number);if(!ActMap.prepareTravel(G,f,l))return;travelBusy=true;if(!save()){delete G.travel;travelBusy=false;showSaveError();return;}const marker=$('.journey-marker'),geo=ActMap.geometry(G.map),[x,y]=geo.xy(f,l);if(marker){marker.style.left=x/geo.width*100+'%';marker.style.top=y+'px';}document.querySelectorAll('[data-map-node],[data-map-action="travel"]').forEach(b=>b.disabled=true);if(!RM)await sleep(700);finishMapTravel()}
function finishMapTravel(){if(!ActMap.commitTravel(G)){travelBusy=false;return;}const {f,l}=G.pos;mapSelected='';mapScroll=null;try{enterEncounter(f,l);save()}finally{travelBusy=false}}
function mountMap(){ActMap.bind($('#app'),G,{scroll:mapScroll,select:k=>{mapScroll=$('.map-scroll').scrollTop;mapSelected=k;render();document.querySelector(`[data-map-node="${k}"]`)?.focus({preventScroll:true});},action:a=>{if(a==='travel')confirmMapTravel();else{mapScroll=$('.map-scroll').scrollTop;mapEffects=!mapEffects;render();}}});}''')
a=s.index('function roll(f,h)');b=s.index('function newRun(h)',a)
s=s[:a]+'''function genMap(h,seed,region='verdant'){return ActMap.generate(h,seed,MapAssets.regions[region].generation)}
function avail(){return ActMap.available(G)}
'''+s[b:]
s=s.replace("oaths:[],map:genMap(h),pos:null,path:[],floor:0", "oaths:[],seed:String(Date.now())+'-'+R(1000000),region:'verdant',map:null,pos:null,path:[],floor:0")
s=s.replace("floor:0};goMap()}","floor:0};G.map=genMap(h,G.seed);mapSelected='';mapScroll=null;goMap()}")
s=s.replace("function goMap(){closeModal();C=null;screen='map';save();render()}","function goMap(){closeModal();C=null;delete G.encounter;delete G.travel;mapSelected='';travelBusy=false;screen='map';save();render()}")
s=s.replace("function enter(f,l){if(!avail().some(([a,b])=>a==f&&b==l))return;G.pos={f,l};G.path.push([f,l]);G.floor=f+1;const t=G.map[f][l].t;", "function enter(f,l){if(screen!=='map'||travelBusy)return;mapSelected=f+','+l;return confirmMapTravel()}\nfunction enterEncounter(f,l){const t=G.map[f][l].t;")
a=s.index('function mapV(){');b=s.index('function heroV(',a)
s=s[:a]+"function mapV(){return ActMap.render(G,{selected:mapSelected,effects:mapEffects,icons:NI})}\n"+s[b:]
s=s.replace("if(screen=='map'){const n=$('.node.can');if(n)try{n.scrollIntoView({block:'center'})}catch(e){}}", "if(screen=='map')mountMap();")
# Above original has else, so remove doubled semicolon before else.
s=s.replace("if(screen=='map')mountMap();else", "if(screen=='map')mountMap();else")
s=s.replace("function render(){PT=null;", "function render(){if(G&&['combat','reward','shop','rest','shrine','event'].includes(screen))save();PT=null;")
s=s.replace("uid=Math.max(0,...G.deck.map(c=>c.u||0))+1;goMap()", "uid=Math.max(0,...G.deck.map(c=>c.u||0))+1;if(G.travel?.status==='pending'){screen='map';render();return finishMapTravel()}if(restoreEncounter())return;goMap()")
s=s.replace("go:v=>{const[f,l]=v.split(',').map(Number);enter(f,l)}", "go:v=>{const[f,l]=v.split(',').map(Number);enter(f,l)}")
s=s.replace('<span class="stat">Floor ${G.floor}/13</span>','<span class="stat">Floor ${G.floor}/${G.map.length}</span>')
p.write_text(s,encoding='utf-8')
