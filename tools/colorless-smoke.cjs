// Optional dependency-free browser smoke test. Requires locally installed Chrome.
const {spawn}=require('node:child_process');
const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const pause=ms=>new Promise(r=>setTimeout(r,ms));
const server=http.createServer((req,res)=>{
 const file=path.resolve(root,'.'+new URL(req.url,'http://local').pathname);
 if(!file.startsWith(root+path.sep)&&file!==root){res.writeHead(403);return res.end()}
 const p=file===root?path.join(root,'index.html'):file;
 try{const data=fs.readFileSync(p);res.setHeader('Content-Type',p.endsWith('.html')?'text/html':p.endsWith('.js')?'text/javascript':p.endsWith('.png')?'image/png':p.endsWith('.webp')?'image/webp':'application/octet-stream');res.end(data)}catch{res.writeHead(404);res.end()}
});
const chromePath=process.env.CHROME_PATH||path.join(process.env.ProgramFiles||'C:/Program Files','Google/Chrome/Application/chrome.exe');
let chrome,sock;
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const profile=fs.mkdtempSync(path.join(require('node:os').tmpdir(),'colorless-smoke-'));
 chrome=spawn(chromePath,['--headless=new','--disable-gpu','--no-first-run','--disable-extensions','--remote-debugging-port=0','--user-data-dir='+profile,'about:blank'],{windowsHide:true,stdio:['ignore','ignore','pipe']});
 const port=await new Promise((resolve,reject)=>{const t=setTimeout(()=>reject(Error('Chrome startup timed out')),15000);chrome.on('error',reject);chrome.stderr.on('data',d=>{const m=String(d).match(/DevTools listening on ws:\/\/127.0.0.1:(\d+)/);if(m){clearTimeout(t);resolve(+m[1])}})});
 const tab=await (await fetch(`http://127.0.0.1:${port}/json/new?about:blank`,{method:'PUT'})).json();
 sock=new WebSocket(tab.webSocketDebuggerUrl);await new Promise(r=>sock.onopen=r);
 let id=0;const pending=new Map(),errors=[];
 sock.onmessage=({data})=>{const m=JSON.parse(data);if(m.id){const cb=pending.get(m.id);pending.delete(m.id);cb(m)}else if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.exception?.description||m.params.exceptionDetails.text)};
 const cmd=(method,params={})=>new Promise(r=>{pending.set(++id,r);sock.send(JSON.stringify({id,method,params}))});
 const evalJS=async expression=>{const m=await cmd('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(m.result.exceptionDetails)throw Error(m.result.exceptionDetails.exception?.description);return m.result.result.value};
 const wait=async expression=>{for(let i=0;i<100;i++){if(await evalJS(expression))return;await pause(60)}throw Error('Timed out: '+expression+' '+JSON.stringify(errors)+' '+await evalJS('document.body.innerText'))};
 const click=async selector=>{await wait(`!!document.querySelector(${JSON.stringify(selector)})`);await evalJS(`document.querySelector(${JSON.stringify(selector)}).dispatchEvent(new MouseEvent("click",{bubbles:true}))`)};
 const count=selector=>evalJS(`document.querySelectorAll(${JSON.stringify(selector)}).length`);
 await cmd('Runtime.enable');await cmd('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
 const url='http://127.0.0.1:'+server.address().port+'/';
 await cmd('Page.navigate',{url});await wait('!!document.querySelector("[data-a=new]")');
 async function saved(id,up=0,type='fight',n=10){
  const g={hero:'aether',hp:70,maxHp:70,gold:999,deck:Array.from({length:n},(_,i)=>({id,up,u:i+1})),relics:['heart'],oaths:[],map:[[{t:type,next:[],jx:0,jy:0}]],pos:null,path:[],floor:0};
  await evalJS(`localStorage.setItem('hollow-ascent-v1',${JSON.stringify(JSON.stringify(g))});window.__oldPage=true;location.reload()`);
  await wait('!window.__oldPage && document.readyState==="complete" && performance.now()>400');
  await click('[data-a=cont]');await click('[data-a=previewNode]');await click('[data-a=travel]');
 }
 await saved('read_the_room');await wait('document.querySelectorAll(".hand .card").length===5');
 await click('.hand .card');await wait('document.querySelector(".modal")?.textContent.includes("Choose one")');await click('.modal [data-a=mask][data-v="0"]');await wait('!document.querySelector(".modal")');assert.match(await evalJS('document.querySelector("#hero").textContent'),/9/);
 await saved('reconsider');await wait('document.querySelectorAll(".hand .card").length===5');await click('.hand .card');await click('.modal [data-a=mclose]');assert.equal(await count('.hand .card'),5);assert.equal(await evalJS('document.querySelector(".orb b").textContent'),'3');
 await saved('second_opinion',1);await wait('document.querySelectorAll(".hand .card").length===5');await click('.hand .card');await click('.modal [data-a=mpick]');await click('.modal [data-a=mpick]');await wait('!document.querySelector(".modal")');assert.equal(await count('.hand .card'),6);
 await saved('brace',0,'shop');await wait('document.querySelectorAll(".ware .card").length===7');assert.equal(await evalJS('[...document.querySelectorAll(".ware .ty")].filter(e=>e.textContent.includes("Colorless")).length'),2);await click('[data-a=inspectware][data-v="5"]');await click('.modal [data-a=buy]');await wait(`!document.querySelector(${JSON.stringify('[data-a=inspectware][data-v="5"]')})`);
 // Press a keyword, then release over the same card's artwork. Browsers dispatch
 // the resulting click to their common ancestor (the playable card).
 await saved('brace');await wait('document.querySelectorAll(".hand .card").length===5');
 const point=async selector=>evalJS(`(()=>{const el=document.querySelector(${JSON.stringify(selector)});const r=el.getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+r.height/2}})()`);
 const card='.hand .card:last-child',word=card+' [data-keyword]',art=card+' .art';
 await cmd('Input.dispatchMouseEvent',{type:'mouseMoved',...await point(word)});
 await pause(300);
 const from=await point(word),to=await point(art);
 assert.equal(await evalJS(`document.elementFromPoint(${from.x},${from.y})?.closest('[data-keyword]')?.textContent`),'Block');
 await cmd('Input.dispatchMouseEvent',{type:'mousePressed',...from,button:'left',clickCount:1});
 await cmd('Input.dispatchMouseEvent',{type:'mouseMoved',...to,buttons:1});
 await cmd('Input.dispatchMouseEvent',{type:'mouseReleased',...to,button:'left',clickCount:1});
 await pause(400);
 assert.equal(await evalJS('document.querySelector(".orb b").textContent'),'3','reading a keyword must not spend Energy');
 // Inspect on a narrow touch viewport, then dismiss and play intentionally.
 await cmd('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
 await cmd('Emulation.setTouchEmulationEnabled',{enabled:true});
 await pause(300);
 const tapAt=async selector=>{
  const position=await point(selector);
  await cmd('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[position]});
  await cmd('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
 };
 await tapAt(word);await wait('!!document.querySelector("#card-keyword-tip")');
 assert.ok(await evalJS(`(()=>{const r=document.querySelector('#card-keyword-tip').getBoundingClientRect();return r.left>=0&&r.right<=innerWidth&&r.top>=0&&r.bottom<=innerHeight})()`));
 await cmd('Input.dispatchKeyEvent',{type:'keyDown',key:'e'});
 await cmd('Input.dispatchKeyEvent',{type:'keyUp',key:'e'});
 assert.ok(await evalJS('!!document.querySelector("#card-keyword-tip")'),'pinned inspection stays open');
 await tapAt(art);assert.equal(await evalJS('document.querySelector(".orb b").textContent'),'3');
 await tapAt(art);await wait('document.querySelector(".orb b").textContent==="2"');
 await saved('hesitation');
 await wait('document.querySelectorAll(".hand .card").length===5');
 assert.ok(await evalJS(`[...document.querySelectorAll('.hand [data-keyword]')].some(w=>w.textContent==='Retain')`));
 assert.deepEqual(errors,[]);
 console.log('Browser smoke passed: saved-run load, Choose One, atomic cancel, two-card ordered choice, dedicated merchant inventory and purchase, mouse and touch keyword inspection, and deliberate card play; no runtime exceptions.');
})().catch(e=>{console.error(e);process.exitCode=1}).finally(()=>{if(sock)sock.close();if(chrome)chrome.kill();server.closeAllConnections();server.close()});
