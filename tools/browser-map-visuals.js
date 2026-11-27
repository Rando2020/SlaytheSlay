async page=>{
 await page.goto('http://127.0.0.1:8878/map-prototype.html');
 await page.setViewportSize({width:1440,height:1000});
 await page.locator('#seed').fill('verdant-27');await page.getByRole('button',{name:'Generate / regenerate paths'}).click();
 await page.screenshot({path:'output/map/lab-desktop.png',fullPage:true});
 const perf=await page.evaluate(()=>{const times=[];const g={hero:'oath',region:'verdant',floor:0,pos:null,path:[],map:ActMap.generate('oath','perf')};const host=document.createElement('div');host.style.width='1000px';document.body.append(host);for(let i=0;i<100;i++){const start=performance.now();host.innerHTML=ActMap.render(g,{});void host.offsetHeight;times.push(performance.now()-start);}host.remove();times.sort((a,b)=>a-b);return {medianMs:times[50],p95Ms:times[95],nodes:g.map.flat().length};});
 await page.locator('#state').selectOption('selected');
 await page.locator('[data-map-node]').filter({has:page.locator('.danger-mark')}).first().focus();
 await page.screenshot({path:'output/map/lab-danger-selected.png',fullPage:true});
 await page.locator('#region').selectOption('twilight');await page.getByRole('button',{name:'Generate / regenerate paths'}).click();
 await page.locator('#layout').selectOption('mobile');await page.setViewportSize({width:390,height:844});
 await page.screenshot({path:'output/map/lab-mobile.png',fullPage:true});
 await page.emulateMedia({reducedMotion:'reduce'});
 const motion=await page.locator('.map-atmosphere').evaluate(e=>getComputedStyle(e).animationName);if(motion!=='none')throw Error('Reduced motion not honored');
 await page.route('**/assets/bg_gate.webp',route=>route.abort());await page.reload();
 await page.locator('#region').selectOption('twilight');await page.getByRole('button',{name:'Generate / regenerate paths'}).click();
 const count=await page.locator('.act-node').count();if(count<10)throw Error('Missing image broke renderer');
 const sc=page.locator('.map-scroll');const before=await sc.evaluate(e=>e.scrollTop);await sc.hover();await page.mouse.wheel(0,-250);await page.waitForTimeout(150);const after=await sc.evaluate(e=>e.scrollTop);if(after>=before)throw Error('Wheel did not scroll');
 await page.unroute('**/assets/bg_gate.webp');await page.emulateMedia({reducedMotion:'no-preference'});
 return {status:'PASS',performance:perf,reducedMotion:true,missingAssetFallback:true,wheelScroll:true,desktop:'1440x1000',mobile:'390x844'};
}
