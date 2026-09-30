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
    await page.waitForFunction(()=>Number(document.querySelector('#boot')?.dataset.v375Frame||0)>6,null,{timeout:5000,polling:'raf'});

    const bodyPoint=()=>page.evaluate(async()=>{
      const THREE=await import('./vendor/three.module.js');
      const i=window.MOVX3D.runtime.instances['boot-tv'];
      const ray=new THREE.Raycaster(),p=new THREE.Vector2(),r=i.canvas.getBoundingClientRect();
      const screen=i.channels.screen,knob=i.model.getObjectByName('tripo_part_8');
      for(const fy of [.25,.34,.55,.70,.82])for(const fx of [.18,.25,.72,.82,.40,.62]){
        p.set(fx*2-1,-(fy*2-1));ray.setFromCamera(p,i.camera);
        const hit=ray.intersectObject(i.model,true)[0]?.object;
        if(hit&&hit!==screen&&hit!==knob)return{x:r.x+fx*r.width,y:r.y+fy*r.height,name:hit.name};
      }
      return null;
    });
    const snap=()=>page.evaluate(()=>{
      const root=document.documentElement,boot=document.querySelector('#boot'),i=window.MOVX3D.runtime.instances['boot-tv'];
      const o=i.objectInteraction.state,g=i.spatialGrab.state,d=i.sceneDirector.state;
      return {
        layer:root.dataset.crtSpatialGrabLayer,ready:root.dataset.crtSpatialGrab,loop:root.dataset.crtSpatialGrabLoop,
        grab:boot.dataset.v375Grab,orbitActive:o.active,engaged:o.engaged,yaw:o.yaw,pitch:o.pitch,velocityYaw:o.velocityYaw,bodyDrags:o.bodyDrags,
        mix:g.mix,cam:{x:i.camera.position.x,y:i.camera.position.y,z:i.camera.position.z},directorCam:{x:d.camX,y:d.camY,z:d.camZ},
        key:i.lights?.key?{x:i.lights.key.position.x,y:i.lights.key.position.y,intensity:i.lights.key.intensity}:null,
        triangles:i.stats.triangles,renderers:document.querySelectorAll('.v322-model-renderer').length,activeSlots:window.MOVX3D.runtime.activeSlots,
        overflow:root.scrollWidth-innerWidth,hint:document.querySelector('.crt-object-hint')?.textContent||''
      };
    });

    const initial=await snap();
    assert.equal(initial.layer,'v375-spatial-grab');assert.equal(initial.ready,'v375-ready');assert.equal(initial.loop,'shared-v322-frame');
    assert.equal(initial.triangles,44831);assert.equal(initial.renderers,1);assert.deepEqual(initial.activeSlots,['boot-tv']);assert.ok(initial.overflow<=2);
    assert.ok(/ORBITAR/.test(initial.hint),'v375 physical grab affordance is missing');

    const p=await bodyPoint();assert.ok(p,'QA could not find a visible cabinet body surface');
    await page.mouse.move(p.x,p.y,{steps:4});await page.mouse.down();
    await page.mouse.move(p.x+150,p.y-42,{steps:12});
    await page.waitForFunction(()=>{
      const i=window.MOVX3D.runtime.instances['boot-tv'];
      return i.objectInteraction.state.active&&i.objectInteraction.state.yaw>.38&&i.spatialGrab.state.mix>.45;
    },null,{timeout:6000,polling:'raf'});
    const held=await snap();
    assert.equal(held.grab,'dragging');assert.equal(held.orbitActive,true);assert.ok(held.bodyDrags>initial.bodyDrags);
    assert.ok(held.yaw>.38,`v375 orbit range still reads like the old restrained turntable: ${held.yaw}`);
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
    fs.writeFileSync('_site/qa-v375-spatial-grab.json',JSON.stringify({initial,held,released,cameraOffsetX,cameraOffsetZ},null,2));
    console.log(JSON.stringify({qa:'v375-spatial-grab',viewport:'desktop',status:'PASS',yaw:held.yaw,cameraOffsetX,cameraOffsetZ,mix:held.mix}));
    await page.close();

    const mobile=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:1});
    await mobile.goto('http://127.0.0.1:4173/',{waitUntil:'domcontentloaded',timeout:30000});
    await mobile.waitForFunction(()=>document.querySelector('[data-model-slot="boot-tv"]')?.dataset.glbState==='ready',null,{timeout:25000});
    await mobile.waitForFunction(()=>document.documentElement.dataset.crtSpatialGrab==='v375-ready',null,{timeout:10000});
    const mobileState=await mobile.evaluate(()=>{const i=window.MOVX3D.runtime.instances['boot-tv'];return {coarse:i.spatialGrab.state.coarse,mix:i.spatialGrab.state.mix,bodyDrags:i.objectInteraction.state.bodyDrags,hint:getComputedStyle(document.querySelector('.crt-object-hint')).display,renderers:document.querySelectorAll('.v322-model-renderer').length,activeSlots:window.MOVX3D.runtime.activeSlots,overflow:document.documentElement.scrollWidth-innerWidth}});
    assert.equal(mobileState.coarse,true);assert.ok(mobileState.mix<.01);assert.equal(mobileState.bodyDrags,0);assert.equal(mobileState.hint,'none');assert.equal(mobileState.renderers,1);assert.deepEqual(mobileState.activeSlots,['boot-tv']);assert.ok(mobileState.overflow<=2);
    console.log(JSON.stringify({qa:'v375-spatial-grab',viewport:'mobile',status:'PASS',mobileState}));
    await mobile.close();
  } finally {await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
