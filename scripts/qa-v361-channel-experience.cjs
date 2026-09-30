const {chromium}=require('playwright');const assert=require('node:assert/strict');const fs=require('node:fs');
(async()=>{
 const browser=await chromium.launch({args:['--no-sandbox','--use-angle=swiftshader','--enable-webgl','--ignore-gpu-blocklist']});const results=[];
 for(const cfg of [{name:'desktop',viewport:{width:1366,height:768}},{name:'mobile',viewport:{width:390,height:844},isMobile:true,hasTouch:true},{name:'reduced',viewport:{width:1280,height:800},reducedMotion:'reduce'}]){
  const p=await browser.newPage(cfg),errors=[];p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
  await p.goto(process.env.MOVX_TEST_URL||'http://127.0.0.1:4173/',{waitUntil:'domcontentloaded'});
  await p.waitForFunction(()=>window.MOVX3D?.runtime?.instances['boot-tv']?.channels?.state.frames>1,null,{timeout:30000});
  await p.waitForFunction(()=>document.documentElement.dataset.motionIntro==='ready');
  const snapshot=()=>p.evaluate(()=>{const i=window.MOVX3D.runtime.instances['boot-tv'],d=i.directManipulation?.state;return {state:{...i.channels.state},pixels:i.channels.canvas.toDataURL(),triangles:i.stats.triangles,screen:i.channels.screen.name,rotation:i.group.rotation.y,dialDrags:d?.dialDrags||0,directAction:d?.lastAction||'none'}});
  const choose=async ch=>{await p.locator(`[data-crt-mode-control="${ch}"]`).click();await p.waitForFunction(c=>window.MOVX3D.runtime.instances['boot-tv'].channels.state.channel===c,ch,{timeout:7000,polling:'raf'});};
  const waitScreenChange=async(previous,test='pixels')=>{
   const started=Date.now();
   await p.waitForFunction(({previous,test})=>{
    const i=window.MOVX3D?.runtime?.instances?.['boot-tv'];if(!i?.channels?.canvas)return false;
    const s=i.channels.state,pixels=i.channels.canvas.toDataURL();
    if(test==='art')return s.art!==previous.state.art&&pixels!==previous.pixels;
    if(test==='variation')return s.variation===previous.state.variation+1&&pixels!==previous.pixels;
    if(test==='mobile')return s.mobile!==previous.state.mobile&&pixels!==previous.pixels;
    return pixels!==previous.pixels;
   },{previous,test},{timeout:7000,polling:'raf'});
   return Date.now()-started;
  };
  /* Find the tiny selector on the cabinet as it actually exists after pointer
     parallax has been consumed. The final point is not accepted until that exact
     current pointer coordinate still ray-hits tripo_part_8 on a later shared frame. */
  const selectorPoint=async()=>{
   const find=()=>p.evaluate(async()=>{
    const THREE=await import('./vendor/three.module.js');const i=window.MOVX3D.runtime.instances['boot-tv'],knob=i.model.getObjectByName('tripo_part_8');
    knob.geometry.computeBoundingBox();const center=knob.geometry.boundingBox.getCenter(new THREE.Vector3());knob.localToWorld(center);center.project(i.camera);
    const r=i.canvas.getBoundingClientRect(),base={x:r.x+(center.x+1)*r.width/2,y:r.y+(1-center.y)*r.height/2};
    const ray=new THREE.Raycaster(),ndc=new THREE.Vector2(),offsets=[0,-4,4,-8,8,-12,12,-16,16,-22,22,-30,30,-38,38];
    for(const dy of offsets)for(const dx of offsets){const x=base.x+dx,y=base.y+dy;ndc.set((x-r.x)/r.width*2-1,-(y-r.y)/r.height*2+1);ray.setFromCamera(ndc,i.camera);const hit=ray.intersectObject(i.model,true)[0]?.object;if(hit===knob)return{x,y,visible:true,centerX:base.x,centerY:base.y};}
    return{x:base.x,y:base.y,visible:false,centerX:base.x,centerY:base.y};
   });
   const stillHits=point=>p.evaluate(async point=>{
    const THREE=await import('./vendor/three.module.js');const i=window.MOVX3D.runtime.instances['boot-tv'],knob=i.model.getObjectByName('tripo_part_8'),r=i.canvas.getBoundingClientRect();
    const ndc=new THREE.Vector2((point.x-r.x)/r.width*2-1,-(point.y-r.y)/r.height*2+1),ray=new THREE.Raycaster();ray.setFromCamera(ndc,i.camera);return ray.intersectObject(i.model,true)[0]?.object===knob;
   },point);
   let point=null;
   for(let n=0;n<7;n++){
    point=await find();assert.equal(point.visible,true,`selector is not visibly ray-hittable at ${JSON.stringify(point)}`);
    const frame=await p.evaluate(()=>Number(document.querySelector('#boot')?.dataset.v371Frame||0));
    await p.mouse.move(point.x,point.y,{steps:n?2:4});
    await p.waitForFunction(previous=>Number(document.querySelector('#boot')?.dataset.v371Frame||0)>previous,frame,{timeout:4000,polling:'raf'});
    if(await stillHits(point))return point;
   }
   assert.fail(`selector never converged under live pointer parallax: ${JSON.stringify(point)}`);
  };
  const action=p.locator('.crt-program-controls button').first();
  await choose('direction');const before=await snapshot();await action.click();const artworkMs=await waitScreenChange(before,'art');const after=await snapshot();assert.notEqual(after.state.art,before.state.art);assert.notEqual(after.pixels,before.pixels,'art must change inside the screen texture');
  if(cfg.name==='desktop'){
   await p.locator('[data-crt-mode-control="motion"]').hover();assert.equal((await snapshot()).state.channel,'direction','hover must not hijack channel selection');
   const hit=await p.evaluate(async()=>{const THREE=await import('./vendor/three.module.js');const i=window.MOVX3D.runtime.instances['boot-tv'],s=i.channels.screen;s.geometry.computeBoundingBox();const v=s.geometry.boundingBox.getCenter(new THREE.Vector3());s.localToWorld(v);v.project(i.camera);const r=i.canvas.getBoundingClientRect();return{x:r.x+(v.x+1)*r.width/2,y:r.y+(1-v.y)*r.height/2}});
   await p.mouse.click(hit.x,hit.y);await waitScreenChange(after,'art');const screenClick=await snapshot();assert.notEqual(screenClick.state.art,after.state.art,'clicking the real screen must change artwork');assert.notEqual(screenClick.pixels,after.pixels,'real screen click must update the screen texture');
  }
  let physicalDial=null;
  if(cfg.name==='desktop'){
   /* Begin only after the exact current coordinate is proven to hit the selector.
      Once pointer capture says the real knob owns the gesture, rotate around the
      center recorded by v363 itself. +0.82 rad is one intentional channel detent. */
   const dial=await selectorPoint(),dial0=await snapshot();
   await p.mouse.down();
   await p.waitForFunction(()=>{const d=window.MOVX3D.runtime.instances['boot-tv'].directManipulation.state;return d.active===true&&d.kind==='knob'},null,{timeout:3000,polling:'raf'});
   const target=await p.evaluate(()=>{const d=window.MOVX3D.runtime.instances['boot-tv'].directManipulation.state,r=Math.max(34,Math.hypot(d.startX-d.knobCenterX,d.startY-d.knobCenterY)),a=d.startAngle+.82;return{x:d.knobCenterX+Math.cos(a)*r,y:d.knobCenterY+Math.sin(a)*r,startAngle:d.startAngle,radius:r}});
   await p.mouse.move(target.x,target.y,{steps:8});await p.mouse.up();
   await p.waitForFunction(previous=>window.MOVX3D.runtime.instances['boot-tv'].directManipulation.state.dialDrags>previous,dial0.dialDrags,{timeout:7000,polling:'raf'});
   physicalDial=await snapshot();
   assert.ok(physicalDial.dialDrags>dial0.dialDrags,'dragging the real CRT selector must tune a channel');
   assert.equal(physicalDial.directAction,'dial-tune','selector drag did not register as a physical dial tune');
   assert.equal(physicalDial.state.channel,'motion','one physical selector detent from DIREÇÃO must tune MOTION');
  }
  await choose('motion');if(!(await snapshot()).state.paused)await action.click();await p.waitForFunction(()=>window.MOVX3D.runtime.instances['boot-tv'].channels.state.paused===true,null,{timeout:7000,polling:'raf'});const frozen=await snapshot();await p.waitForTimeout(350);const still=await snapshot();assert.equal(still.state.paused,true,'pause state must remain active');assert.equal(still.state.phase,frozen.state.phase,'pause must freeze the Motion programme phase even while tactile overlays remain live');
  const slider=p.locator('.crt-program-range input');await slider.fill('90');await slider.dispatchEvent('input');await p.waitForFunction(previous=>Math.abs(window.MOVX3D.runtime.instances['boot-tv'].channels.state.phase-previous)>.001,frozen.state.phase,{timeout:7000,polling:'raf'});const scrubbed=await snapshot();assert.notEqual(scrubbed.state.phase,frozen.state.phase,'paused timeline must remain scrubbable');
  await action.click();const phase=(await snapshot()).state.phase;const resumeStart=Date.now();
  await p.waitForFunction(previous=>{const s=window.MOVX3D.runtime.instances['boot-tv'].channels.state;return s.paused===false&&s.phase>previous+.001},phase,{timeout:7000,polling:'raf'});
  const resumed=await snapshot();assert.equal(resumed.state.paused,false,'play must clear the pause state');assert.ok(resumed.state.phase>phase,'play must resume motion');const resumeMs=Date.now()-resumeStart;
  await choose('ai');const ai=await snapshot();await action.click();const variationMs=await waitScreenChange(ai,'variation');const aiChanged=await snapshot();assert.equal(aiChanged.state.variation,ai.state.variation+1);assert.notEqual(aiChanged.pixels,ai.pixels);
  await choose('digital');const desktop=await snapshot();await action.click();const responsiveMs=await waitScreenChange(desktop,'mobile');const mobile=await snapshot();assert.notEqual(mobile.state.mobile,desktop.state.mobile);assert.notEqual(mobile.pixels,desktop.pixels);
  assert.equal(mobile.triangles,44831);assert.equal(mobile.screen,'tripo_part_1');
  const layout=await p.evaluate(()=>{const panel=document.querySelector('#crt-channel-panel').getBoundingClientRect(),scene=document.querySelector('#boot .scene-inner').getBoundingClientRect();return{overflow:document.documentElement.scrollWidth-innerWidth,panelInside:panel.bottom<=scene.bottom+2,canvases:document.querySelectorAll('.v322-model-renderer canvas').length}});
  assert.ok(layout.overflow<=2);assert.ok(layout.panelInside,'program controls must not be clipped');assert.equal(layout.canvases,1);assert.deepEqual(errors,[]);
  await p.locator('#boot').screenshot({path:`_site/qa-v361-${cfg.name}-experience.png`});
  results.push({name:cfg.name,status:'PASS',actions:['artwork','screen click','physical selector detent','pause','scrub','play','variation','responsive interface'],timing:{artworkMs,resumeMs,variationMs,responsiveMs},physicalDial:physicalDial?{channel:physicalDial.state.channel,dialDrags:physicalDial.dialDrags,lastAction:physicalDial.directAction}:null,layout});await p.close();
 }
 await browser.close();fs.writeFileSync('_site/qa-v361-results.json',JSON.stringify(results,null,2));console.log(JSON.stringify(results));
})().catch(e=>{console.error(e);process.exit(1)});
