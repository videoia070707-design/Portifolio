const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');

(async()=>{
  const models=fs.readdirSync('_site/models').filter(x=>x.toLowerCase().endsWith('.glb')).sort();
  assert.deepEqual(models,['movx-crt-tv.glb'],'v375 must keep exactly one production GLB');
  const browser=await chromium.launch({headless:true,args:['--no-sandbox','--use-angle=swiftshader','--enable-webgl','--ignore-gpu-blocklist']});
  try{
    const page=await browser.newPage({viewport:{width:1366,height:768},deviceScaleFactor:1});
    const errors=[];page.on('pageerror',e=>errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
    await page.goto('http://127.0.0.1:4173/',{waitUntil:'domcontentloaded',timeout:30000});
    await page.waitForFunction(()=>document.querySelector('[data-model-slot="boot-tv"]')?.dataset.glbState==='ready',null,{timeout:25000});
    await page.waitForFunction(()=>document.documentElement.dataset.crtSpatialGrab==='v375-ready',null,{timeout:10000});
    /* v386.9 is the strict scene-field superset of v386.8's stage-pick surface.
       Keep the physical body-grab contract, but require the current production
       marker rather than a historical implementation label. */
    await page.waitForFunction(()=>document.documentElement.dataset.crtInputSurface==='v386.9-scene-field',null,{timeout:5000});
    await page.waitForFunction(()=>Number(document.querySelector('#boot')?.dataset.v375Frame||0)>6,null,{timeout:5000,polling:'raf'});

    /* Find a cabinet ray-hit that is explicitly outside the selector's v386.5
       projected pickup radius. After moving the real pointer there, re-raycast on
       a later shared frame because Scene-01 presence/camera can move the cabinet.
       This gate is for BODY orbit; it must never accidentally test the dial. */
    const findBodyPoint=()=>page.evaluate(async()=>{
      const THREE=await import('./vendor/three.module.js');
      const i=window.MOVX3D.runtime.instances['boot-tv'];
      const ray=new THREE.Raycaster(),ndc=new THREE.Vector2(),r=i.canvas.getBoundingClientRect();
      const screen=i.channels.screen,knob=i.model.getObjectByName('tripo_part_8');
      knob.geometry.computeBoundingBox();const kc=knob.geometry.boundingBox.getCenter(new THREE.Vector3());knob.localToWorld(kc);kc.project(i.camera);
      const knobPoint={x:r.x+(kc.x+1)*r.width/2,y:r.y+(1-kc.y)*r.height/2};
      const selectorRadius=Math.max(24,Math.min(36,r.width*.042))+22;
      const candidates=[
        [.16,.24],[.24,.24],[.34,.22],[.64,.22],[.76,.24],[.84,.30],
        [.14,.43],[.82,.45],[.16,.62],[.82,.64],[.22,.77],[.70,.78],
        [.36,.86],[.58,.86]
      ];
      for(const [fx,fy] of candidates){
        const x=r.x+fx*r.width,y=r.y+fy*r.height;
        if(Math.hypot(x-knobPoint.x,y-knobPoint.y)<=selectorRadius)continue;
        ndc.set(fx*2-1,-(fy*2-1));ray.setFromCamera(ndc,i.camera);
        const hit=ray.intersectObject(i.model,true)[0]?.object;
        if(hit&&hit!==screen&&hit!==knob)return{x,y,name:hit.name,knobPoint,selectorRadius};
      }
      return null;
    });
    const stillBody=point=>page.evaluate(async point=>{
      const THREE=await import('./vendor/three.module.js');
      const i=window.MOVX3D.runtime.instances['boot-tv'],r=i.canvas.getBoundingClientRect();
      const screen=i.channels.screen,knob=i.model.getObjectByName('tripo_part_8');
      knob.geometry.computeBoundingBox();const kc=knob.geometry.boundingBox.getCenter(new THREE.Vector3());knob.localToWorld(kc);kc.project(i.camera);
      const knobPoint={x:r.x+(kc.x+1)*r.width/2,y:r.y+(1-kc.y)*r.height/2};
      const selectorRadius=Math.max(24,Math.min(36,r.width*.042))+18;
      if(Math.hypot(point.x-knobPoint.x,point.y-knobPoint.y)<=selectorRadius)return false;
      const ndc=new THREE.Vector2((point.x-r.x)/r.width*2-1,-(point.y-r.y)/r.height*2+1),ray=new THREE.Raycaster();
      ray.setFromCamera(ndc,i.camera);const hit=ray.intersectObject(i.model,true)[0]?.object;
      return !!hit&&hit!==screen&&hit!==knob;
    },point);
    const bodyPoint=async()=>{
      let point=null;
      for(let attempt=0;attempt<6;attempt++){
        point=await findBodyPoint();assert.ok(point,`QA could not find a visible cabinet body surface on attempt ${attempt+1}`);
        const frame=await page.evaluate(()=>Number(document.querySelector('#boot')?.dataset.v371Frame||0));
        await page.mouse.move(point.x,point.y,{steps:attempt?3:6});
        await page.waitForFunction(previous=>Number(document.querySelector('#boot')?.dataset.v371Frame||0)>previous,frame,{timeout:4000,polling:'raf'});
        if(await stillBody(point))return {...point,attempts:attempt+1};
      }
      assert.fail(`cabinet body never converged under live Scene-01 parallax: ${JSON.stringify(point)}`);
    };
    const snap=()=>page.evaluate(()=>{
      const root=document.documentElement,boot=document.querySelector('#boot'),i=window.MOVX3D.runtime.instances['boot-tv'];
      const o=i.objectInteraction.state,g=i.spatialGrab.state,d=i.sceneDirector.state;
      return {
        layer:root.dataset.crtSpatialGrabLayer,ready:root.dataset.crtSpatialGrab,loop:root.dataset.crtSpatialGrabLoop,inputSurface:root.dataset.crtInputSurface,
        grab:boot.dataset.v375Grab,orbitActive:o.active,engaged:o.engaged,yaw:o.yaw,pitch:o.pitch,velocityYaw:o.velocityYaw,bodyDrags:o.bodyDrags,
        directActive:i.directManipulation.state.active,directKind:i.directManipulation.state.kind,
        mix:g.mix,cam:{x:i.camera.position.x,y:i.camera.position.y,z:i.camera.position.z},directorCam:{x:d.camX,y:d.camY,z:d.camZ},
        key:i.lights?.key?{x:i.lights.key.position.x,y:i.lights.key.position.y,intensity:i.lights.key.intensity}:null,
        triangles:i.stats.triangles,renderers:document.querySelectorAll('.v322-model-renderer').length,activeSlots:window.MOVX3D.runtime.activeSlots,
        overflow:root.scrollWidth-innerWidth,hint:document.querySelector('.crt-object-hint')?.textContent||''
      };
    });

    const initial=await snap();
    assert.equal(initial.layer,'v375-spatial-grab');assert.equal(initial.ready,'v375-ready');assert.equal(initial.loop,'shared-v322-frame');
    assert.equal(initial.inputSurface,'v386.9-scene-field');
    assert.equal(initial.triangles,44831);assert.equal(initial.renderers,1);assert.deepEqual(initial.activeSlots,['boot-tv']);assert.ok(initial.overflow<=2);
    assert.ok(/ORBITAR/.test(initial.hint),'v375 physical grab affordance is missing');

    const p=await bodyPoint();
    await page.mouse.down();
    await page.waitForFunction(()=>{
      const i=window.MOVX3D.runtime.instances['boot-tv'];
      return i.objectInteraction.state.active===true&&i.directManipulation.state.active===false;
    },null,{timeout:2500,polling:'raf'});
    /* Do not slam the authored ±0.50 rad safety stop before testing momentum.
       95px still forces >0.36 rad — clearly beyond v364's old ±0.34 range — but
       leaves enough angular headroom for the final pointer samples to carry a
       measurable release velocity. */
    await page.mouse.move(p.x+95,p.y-30,{steps:12});
    await page.waitForFunction(()=>{
      const i=window.MOVX3D.runtime.instances['boot-tv'];
      return i.objectInteraction.state.active&&i.objectInteraction.state.yaw>.36&&i.spatialGrab.state.mix>.45;
    },null,{timeout:6000,polling:'raf'});
    const held=await snap();
    assert.equal(held.grab,'dragging');assert.equal(held.orbitActive,true);assert.equal(held.directActive,false);assert.ok(held.bodyDrags>initial.bodyDrags);
    assert.ok(held.yaw>.36,`v375 orbit range still reads like the old restrained turntable: ${held.yaw}`);
    assert.ok(held.yaw<.49,`inertia QA accidentally hit the v375 safety stop: ${held.yaw}`);
    const cameraOffsetX=held.cam.x-held.directorCam.x,cameraOffsetZ=held.cam.z-held.directorCam.z;
    assert.ok(Math.abs(cameraOffsetX)>.035,`direct grab did not move the viewer laterally: ${cameraOffsetX}`);
    assert.ok(cameraOffsetZ<-.025,`direct grab did not pull the viewer into the object depth: ${cameraOffsetZ}`);
    assert.ok(Math.abs(held.key.x-initial.key.x)>.08,'existing key light did not react to the physical grab');
    await page.locator('#boot').screenshot({path:'_site/qa-v375-spatial-grab-held.png'});

    await page.mouse.up();
    await page.waitForFunction(()=>{
      const i=window.MOVX3D.runtime.instances['boot-tv'];
      return !i.objectInteraction.state.active&&i.spatialGrab.state.mix>.12;
    },null,{timeout:3000,polling:'raf'});
    const released=await snap();
    assert.equal(released.orbitActive,false);assert.ok(released.mix>.12,'camera/light response cut off instead of carrying inertia');
    assert.ok(Math.abs(released.velocityYaw)>.01,'cabinet released with no physical inertia');
    assert.ok(['inertia','dragging'].includes(released.grab),'release did not enter spatial inertia state');
    assert.equal(errors.length,0,'desktop page errors: '+errors.join(' | '));
    fs.writeFileSync('_site/qa-v375-spatial-grab.json',JSON.stringify({initial,pick:p,held,released,cameraOffsetX,cameraOffsetZ},null,2));
    console.log(JSON.stringify({qa:'v375-spatial-grab',viewport:'desktop',status:'PASS',pickAttempts:p.attempts,yaw:held.yaw,releaseVelocity:released.velocityYaw,cameraOffsetX,cameraOffsetZ,mix:held.mix}));
    await page.close();

    const mobile=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:1});
    await mobile.goto('http://127.0.0.1:4173/',{waitUntil:'domcontentloaded',timeout:30000});
    await mobile.waitForFunction(()=>document.querySelector('[data-model-slot="boot-tv"]')?.dataset.glbState==='ready',null,{timeout:25000});
    await mobile.waitForFunction(()=>document.documentElement.dataset.crtSpatialGrab==='v375-ready',null,{timeout:10000});
    const mobileState=await mobile.evaluate(()=>{const i=window.MOVX3D.runtime.instances['boot-tv'];return {coarse:i.spatialGrab.state.coarse,mix:i.spatialGrab.state.mix,bodyDrags:i.objectInteraction.state.bodyDrags,hint:getComputedStyle(document.querySelector('.crt-object-hint')).display,inputSurface:document.documentElement.dataset.crtInputSurface,renderers:document.querySelectorAll('.v322-model-renderer').length,activeSlots:window.MOVX3D.runtime.activeSlots,overflow:document.documentElement.scrollWidth-innerWidth}});
    assert.equal(mobileState.coarse,true);assert.ok(mobileState.mix<.01);assert.equal(mobileState.bodyDrags,0);assert.equal(mobileState.hint,'none');assert.equal(mobileState.inputSurface,'v386.9-scene-field');assert.equal(mobileState.renderers,1);assert.deepEqual(mobileState.activeSlots,['boot-tv']);assert.ok(mobileState.overflow<=2);
    console.log(JSON.stringify({qa:'v375-spatial-grab',viewport:'mobile',status:'PASS',mobileState}));
    await mobile.close();
  } finally {await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});