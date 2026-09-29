const {chromium}=require('playwright');const assert=require('node:assert/strict');const fs=require('node:fs');
(async()=>{
 const browser=await chromium.launch({args:['--no-sandbox','--use-angle=swiftshader','--enable-webgl','--ignore-gpu-blocklist']});const results=[];
 for(const cfg of [{name:'desktop',viewport:{width:1366,height:768}},{name:'mobile',viewport:{width:390,height:844},isMobile:true,hasTouch:true},{name:'reduced',viewport:{width:1280,height:800},reducedMotion:'reduce'}]){
  const p=await browser.newPage(cfg),errors=[];p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
  await p.goto(process.env.MOVX_TEST_URL||'http://127.0.0.1:4173/',{waitUntil:'domcontentloaded'});
  await p.waitForFunction(()=>window.MOVX3D?.runtime?.instances['boot-tv']?.channels?.state.frames>1,null,{timeout:30000});
  await p.waitForFunction(()=>document.documentElement.dataset.motionIntro==='ready');
  const snapshot=()=>p.evaluate(()=>{const i=window.MOVX3D.runtime.instances['boot-tv'];return {state:{...i.channels.state},pixels:i.channels.canvas.toDataURL(),triangles:i.stats.triangles,screen:i.channels.screen.name,rotation:i.group.rotation.y}});
  const choose=async ch=>{await p.locator(`[data-crt-mode-control="${ch}"]`).click();await p.waitForFunction(c=>window.MOVX3D.runtime.instances['boot-tv'].channels.state.channel===c,ch);await p.waitForTimeout(550)};
  const action=p.locator('.crt-program-controls button').first();
  await choose('direction');const before=await snapshot();await action.click();await p.waitForTimeout(550);const after=await snapshot();assert.notEqual(after.state.art,before.state.art);assert.notEqual(after.pixels,before.pixels,'art must change inside the screen texture');
  if(cfg.name==='desktop'){
   await p.locator('[data-crt-mode-control="motion"]').hover();assert.equal((await snapshot()).state.channel,'direction','hover must not hijack channel selection');
   const hit=await p.evaluate(async()=>{const THREE=await import('./vendor/three.module.js');const i=window.MOVX3D.runtime.instances['boot-tv'],s=i.channels.screen;const v=s.geometry.boundingBox.getCenter(new THREE.Vector3());s.localToWorld(v);v.project(i.camera);const r=i.canvas.getBoundingClientRect();return {x:r.x+(v.x+1)*r.width/2,y:r.y+(1-v.y)*r.height/2}});
   await p.mouse.click(hit.x,hit.y);await p.waitForTimeout(550);assert.notEqual((await snapshot()).state.art,after.state.art,'clicking the real screen must change artwork');
  }
  if(cfg.name==='desktop'){
   const dial=await p.evaluate(async()=>{const THREE=await import('./vendor/three.module.js');const i=window.MOVX3D.runtime.instances['boot-tv'],knob=i.model.getObjectByName('tripo_part_8');knob.geometry.computeBoundingBox();const v=knob.geometry.boundingBox.getCenter(new THREE.Vector3());knob.localToWorld(v);v.project(i.camera);const r=i.canvas.getBoundingClientRect();return {x:r.x+(v.x+1)*r.width/2,y:r.y+(1-v.y)*r.height/2}});
   await p.mouse.click(dial.x,dial.y);await p.waitForFunction(()=>window.MOVX3D.runtime.instances['boot-tv'].channels.state.channel==='motion',null,{timeout:4000});
  }
  await choose('motion');if(!(await snapshot()).state.paused)await action.click();await p.waitForTimeout(550);const frozen=await snapshot();await p.waitForTimeout(350);assert.equal((await snapshot()).pixels,frozen.pixels,'pause must freeze screen output');
  const slider=p.locator('.crt-program-range input');await slider.fill('90');await slider.dispatchEvent('input');await p.waitForTimeout(150);assert.notEqual((await snapshot()).pixels,frozen.pixels,'paused timeline must remain scrubbable');
  await action.click();const phase=(await snapshot()).state.phase;await p.waitForTimeout(350);assert.ok((await snapshot()).state.phase>phase,'play must resume motion');
  await choose('ai');const ai=await snapshot();await action.click();await p.waitForTimeout(550);assert.equal((await snapshot()).state.variation,ai.state.variation+1);assert.notEqual((await snapshot()).pixels,ai.pixels);
  await choose('digital');const desktop=await snapshot();await action.click();await p.waitForTimeout(550);const mobile=await snapshot();assert.notEqual(mobile.state.mobile,desktop.state.mobile);assert.notEqual(mobile.pixels,desktop.pixels);
  assert.equal(mobile.triangles,44831);assert.equal(mobile.screen,'tripo_part_1');
  const layout=await p.evaluate(()=>{const panel=document.querySelector('#crt-channel-panel').getBoundingClientRect(),scene=document.querySelector('#boot .scene-inner').getBoundingClientRect();return {overflow:document.documentElement.scrollWidth-innerWidth,panelInside:panel.bottom<=scene.bottom+2,canvases:document.querySelectorAll('.v322-model-renderer canvas').length}});
  assert.ok(layout.overflow<=2);assert.ok(layout.panelInside,'program controls must not be clipped');assert.equal(layout.canvases,1);assert.deepEqual(errors,[]);
  await p.locator('#boot').screenshot({path:`_site/qa-v361-${cfg.name}-experience.png`});
  results.push({name:cfg.name,status:'PASS',actions:['artwork','screen click','pause','scrub','play','variation','responsive interface'],layout});await p.close();
 }
 await browser.close();fs.writeFileSync('_site/qa-v361-results.json',JSON.stringify(results,null,2));console.log(JSON.stringify(results));
})().catch(e=>{console.error(e);process.exit(1)});
