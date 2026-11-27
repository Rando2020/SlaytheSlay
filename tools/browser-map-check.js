async page=>{
 await page.setViewportSize({width:1440,height:1000});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const check=(ok,msg)=>{if(!ok)throw Error(msg);};
 await page.goto('http://127.0.0.1:8878/output/map-qa.html');
 await page.evaluate(()=>mapQA.start('oath'));
 await page.locator('.act-node.available').first().click();
 await page.getByRole('button',{name:'Confirm travel',exact:true}).waitFor();
 await page.screenshot({path:'output/map/game-desktop.png',fullPage:true});
 await page.setViewportSize({width:390,height:844});await page.waitForTimeout(220);
 await page.screenshot({path:'output/map/game-mobile.png',fullPage:true});
 check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'mobile overflow');
 const keyboard=page.locator('[data-map-node="0,0"]');await keyboard.focus();await page.keyboard.press('ArrowUp');
 check(await page.evaluate(()=>document.activeElement.dataset.mapNode.startsWith('1,')),'arrow navigation');
 await page.evaluate(()=>{mapQA.select('0,0');mapQA.confirm();mapQA.confirm();});
 let saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('hollow-ascent-v1')));
 check(saved.travel.status==='pending'&&saved.floor===0,'pending write before animation');
 await page.reload();await page.waitForFunction(()=>performance.now()>400);await page.getByRole('button',{name:/Continue from floor/}).click();
 await page.locator('.stage').waitFor();
 let state=await page.evaluate(()=>mapQA.state());check(state.G.path.length===1&&state.G.floor===1&&state.screen==='combat','pending resume once');
 check(state.C.hand.length>0&&state.C.turn===1,'combat opening preserved');
 await page.screenshot({path:'output/map/combat-mobile.png',fullPage:true});
 const before=JSON.stringify(state.C);await page.evaluate(()=>mapQA.mutateBusy());await page.reload();await page.waitForFunction(()=>performance.now()>400);await page.getByRole('button',{name:/Continue from floor/}).click();
 state=await page.evaluate(()=>mapQA.state());check(JSON.stringify(state.C)===before,'combat snapshot resume without reroll');
 await page.evaluate(()=>mapQA.victory());
 await page.reload();await page.waitForFunction(()=>performance.now()>400);await page.getByRole('button',{name:/Continue from floor/}).click();
 state=await page.evaluate(()=>mapQA.state());check(state.screen==='reward','victory delay resumes to reward');
 const rewardGold=state.G.gold;await page.reload();await page.waitForFunction(()=>performance.now()>400);await page.getByRole('button',{name:/Continue from floor/}).click();
 check((await page.evaluate(()=>mapQA.state())).G.gold===rewardGold,'victory reward once');
 // Exercise every supported noncombat encounter, preserving reward mutations through refresh.
 for(const type of ['chest','event','rest','shop','shrine']){
  await page.evaluate(t=>{mapQA.fixture(t);mapQA.select('0,0');mapQA.confirm();},type);
  await page.waitForFunction(()=>mapQA.state().G.travel?.status==='active');
  if(type==='event')await page.evaluate(()=>mapQA.action('evo','1'));
  if(type==='rest')await page.evaluate(()=>mapQA.action('rheal'));
  if(type==='chest')await page.evaluate(()=>mapQA.action('rrelic'));
  const initial=await page.evaluate(()=>mapQA.state());
  await page.reload();await page.waitForFunction(()=>performance.now()>400);await page.getByRole('button',{name:/Continue from floor/}).click();
  const restored=await page.evaluate(()=>mapQA.state());
  check(JSON.stringify(initial)===JSON.stringify(restored),type+' persists exact encounter and rewards');
 }
 // Failed persistence leaves the route untouched.
 await page.evaluate(()=>{mapQA.start('oath');mapQA.select('0,0');Storage.prototype.setItem=function(){throw Error('quota')};mapQA.confirm();});
 state=await page.evaluate(()=>mapQA.state());check(state.G.floor===0&&!state.G.travel,'failed storage rollback');
 await page.getByRole('alert').filter({hasText:'could not be saved'}).waitFor();
 await page.reload();
 // Legacy save remains the same graph and resumes at map.
 await page.evaluate(()=>{mapQA.start('aether');const g=mapQA.state().G;delete g.seed;delete g.region;delete g.encounter;localStorage.setItem('hollow-ascent-v1',JSON.stringify(g));});
 const legacy=await page.evaluate(()=>JSON.parse(localStorage.getItem('hollow-ascent-v1')).map);
 await page.reload();await page.waitForFunction(()=>performance.now()>400);await page.getByRole('button',{name:/Continue from floor/}).click();
 state=await page.evaluate(()=>mapQA.state());check(JSON.stringify(state.G.map)===JSON.stringify(legacy),'legacy graph retained');
 check(errors.length===0,'page errors: '+errors.join('; '));
 console.log('PASS: desktop/mobile, keyboard, double confirmation, pending reload, combat reload, all five service encounters, reward idempotency, quota rollback, legacy graph');
}
