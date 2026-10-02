const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');

(async()=>{
  const models=fs.readdirSync('_site/models').filter(x=>x.toLowerCase().endsWith('.glb')).sort();
  assert.deepEqual(models,['movx-crt-tv.glb'],'v368 must keep exactly one production GLB');

  const browser=await chromium.launch({headless:true,args:['--no-sandbox','--use-angle=swiftshader','--enable-webgl','--ignore-gpu-blocklist']});
  try{
    const page=await browser.newPage({viewport:{width:1440,height:1000},deviceScaleFactor:1});
    const errors=[];page.on('pageerror',e=>errors.push(String(e)));
    await page.goto('http://127.0.0.1:4173/',{waitUntil:'domcontentloaded',timeout:30000});
    await page.waitForFunction(()=>document.documentElement.dataset.crtScenePresence==='v368-ready',null,{timeout:20000});
    await page.waitForFunction(()=>document.querySelector('[data-model-slot="boot-tv"]')?.dataset.glbState==='ready',null,{timeout:20000});
    await page.waitForFunction(()=>document.documentElement.dataset.motionIntro==='ready',null,{timeout:12000});
    await page.waitForFunction(()=>Number(document.querySelector('#boot')?.dataset.v368Frame||0)>4,null,{timeout:5000});

    const initial=await page.evaluate(()=>{
      const root=document.documentElement,boot=document.querySelector('#boot');
      const r=window.MOVX3D.runtime,inst=r.instances['boot-tv'];
      return {
        marker:root.dataset.crtScenePresence,
        loop:root.dataset.crtScenePresenceLoop,
        layer:root.dataset.crtScenePresenceLayer,
        pointer:boot.dataset.v368ScenePointer,
        source:boot.dataset.v367PresenceSource,
        sceneMix:inst.scenePresence.state.mix,
        objectMix:inst.presence.state.hoverMix,
        cameraX:inst.camera.position.x,
        presenceSurface:root.dataset.crtPresenceSurface||'',
        presenceInput:inst.presence.state.inputSurface||'',
        renderers:document.querySelectorAll('.v322-model-renderer').length,
        activeSlots:r.activeSlots,
        deferred:r.deferredSlots,
        triangles:inst.stats.triangles,
        overflow:root.scrollWidth-innerWidth,
        errors:r.errors,
      };
    });
    assert.equal(initial.marker,'v368-ready');
    assert.equal(initial.loop,'shared-v322-frame');
    assert.equal(initial.layer,'v368-scene-presence');
    assert.equal(initial.presenceSurface,'v386.13-scene-field');
    assert.equal(initial.presenceInput,'scene-inner');
    assert.equal(initial.renderers,1);
    assert.deepEqual(initial.activeSlots,['boot-tv']);
    assert.ok(initial.deferred.includes('hero-movx-logo')&&initial.deferred.includes('x-portal'),'later models escaped the gate');
    assert.equal(initial.triangles,44831);
    assert.ok(initial.overflow<=2);
    assert.equal(initial.errors.length,0);

    // Core v368 contract: the visitor can be over the editorial copy, outside
    // the TV hit surface, and the *scene* still becomes spatially aware.
    const copy=page.locator('#boot .boot-copy');
    const copyBox=await copy.boundingBox();assert.ok(copyBox&&copyBox.width>200&&copyBox.height>200);
    await page.mouse.move(copyBox.x+copyBox.width*.78,copyBox.y+Math.min(copyBox.height*.22,145),{steps:12});
    await page.waitForFunction((baselineX)=>{
      const inst=window.MOVX3D.runtime.instances['boot-tv'];
      const sp=inst.scenePresence.state;
      return sp.mix>.30 && Math.abs(sp.x)>.08 && Math.abs(inst.camera.position.x-baselineX)>.007;
    },initial.cameraX,{timeout:7000,polling:'raf'});
    const editorial=await page.evaluate((baselineX)=>{
      const boot=document.querySelector('#boot'),inst=window.MOVX3D.runtime.instances['boot-tv'];
      return {
        sceneMix:inst.scenePresence.state.mix,
        sceneX:inst.scenePresence.state.x,
        sceneY:inst.scenePresence.state.y,
        objectMix:inst.presence.state.hoverMix,
        source:boot.dataset.v367PresenceSource,
        cameraX:inst.camera.position.x,
        cameraDelta:inst.camera.position.x-baselineX,
        title:[...boot.querySelectorAll('.boot-title span')].map(el=>getComputedStyle(el).transform),
        lightX:getComputedStyle(boot).getPropertyValue('--v367-light-x').trim(),
      };
    },initial.cameraX);
    assert.ok(editorial.sceneMix>.30,'scene-wide presence did not engage over editorial copy');
    assert.ok(Math.abs(editorial.sceneX)>.08,'scene-wide pointer coordinates did not update');
    assert.ok(editorial.objectMix<.10,'CRT object-hover presence leaked onto editorial copy');
    assert.equal(editorial.source,'scene','v367 director did not consume v368 scene presence');
    assert.ok(Math.abs(editorial.cameraDelta)>.007,'editorial pointer did not move the actual Three.js camera');
    assert.ok(editorial.title.some(x=>x!=='none'),'editorial typography did not share the scene response');

    // Current v386 geometry can project outside the historical .crt-wrap. Find a
    // point that raycasts the *actual transformed GLB* inside the authored scene
    // instead of assuming the old wrapper centre still overlaps the television.
    const visibleTVPoint=await page.evaluate(async()=>{
      const THREE=await import('./vendor/three.module.js');
      const inst=window.MOVX3D.runtime.instances['boot-tv'];
      const scene=document.querySelector('#boot .scene-inner').getBoundingClientRect();
      const canvas=inst.canvas.getBoundingClientRect();
      const ray=new THREE.Raycaster(),ndc=new THREE.Vector2();
      inst.scene.updateMatrixWorld(true);inst.camera.updateMatrixWorld(true);
      const xs=[.10,.16,.22,.28,.34,.40,.46,.52,.58,.64,.70,.76,.82,.88];
      const ys=[.16,.22,.28,.34,.40,.46,.52,.58,.64,.70,.76,.82,.88];
      for(const fy of ys)for(const fx of xs){
        const x=scene.left+scene.width*fx,y=scene.top+scene.height*fy;
        if(x<canvas.left||x>canvas.right||y<canvas.top||y>canvas.bottom)continue;
        const dom=document.elementFromPoint(x,y);
        if(dom?.closest?.('button,a,input,label,select,textarea'))continue;
        ndc.set((x-canvas.left)/canvas.width*2-1,-((y-canvas.top)/canvas.height*2-1));
        ray.setFromCamera(ndc,inst.camera);
        const hit=ray.intersectObject(inst.model,true)[0];
        if(hit)return{x,y,name:hit.object.name};
      }
      return null;
    });
    assert.ok(visibleTVPoint,`v368 QA could not find visible real CRT geometry in Scene 01: ${JSON.stringify(visibleTVPoint)}`);
    await page.mouse.move(visibleTVPoint.x,visibleTVPoint.y,{steps:10});
    await page.waitForFunction(()=>{
      const i=window.MOVX3D.runtime.instances['boot-tv'];
      return document.documentElement.dataset.crtPresenceSurface==='v386.13-scene-field' &&
        i.presence.state.inputSurface==='scene-inner' &&
        i.scenePresence.state.mix>.25 && i.presence.state.hoverMix>.12;
    },null,{timeout:7000,polling:'raf'});
    const tv=await page.evaluate((point)=>{
      const i=window.MOVX3D.runtime.instances['boot-tv'];
      return {sceneMix:i.scenePresence.state.mix,objectMix:i.presence.state.hoverMix,scenePointer:document.querySelector('#boot').dataset.v368ScenePointer,presenceSurface:document.documentElement.dataset.crtPresenceSurface,inputSurface:i.presence.state.inputSurface,point};
    },visibleTVPoint);
    assert.ok(tv.sceneMix>.25);assert.ok(tv.objectMix>.12,'physical CRT presence stopped working under v368/v386.13');
    assert.equal(tv.presenceSurface,'v386.13-scene-field');assert.equal(tv.inputSurface,'scene-inner');

    await page.locator('[data-crt-mode-control="motion"]').click();
    await page.waitForFunction(()=>window.MOVX3D.runtime.instances['boot-tv'].channels.state.channel==='motion',null,{timeout:7000});
    const channel=await page.evaluate(()=>{
      const i=window.MOVX3D.runtime.instances['boot-tv'];
      return {channel:i.channels.state.channel,director:i.sceneDirector.state.channel,source:i.sceneDirector.state.presenceSource};
    });
    assert.equal(channel.channel,'motion');assert.equal(channel.director,'motion');assert.equal(channel.source,'scene');

    // Leaving the authored scene must decay the global presence instead of
    // leaving the camera/light system latched to the last pointer position.
    await page.mouse.move(4,4,{steps:8});
    await page.waitForFunction(()=>{
      const s=window.MOVX3D.runtime.instances['boot-tv'].scenePresence.state;
      return !s.inside && s.mix<.10 && Math.abs(s.x)<.10 && Math.abs(s.y)<.10;
    },null,{timeout:7000,polling:'raf'});
    const leave=await page.evaluate(()=>{
      const boot=document.querySelector('#boot'),s=window.MOVX3D.runtime.instances['boot-tv'].scenePresence.state;
      return {inside:s.inside,mix:s.mix,x:s.x,y:s.y,resets:s.resets,pointer:boot.dataset.v368ScenePointer};
    });
    assert.equal(leave.inside,false);assert.ok(leave.mix<.10);assert.ok(leave.resets>=1);assert.equal(leave.pointer,'idle');
    assert.equal(errors.length,0,'desktop page errors: '+errors.join(' | '));

    await page.screenshot({path:'_site/qa-v368-scene-presence-desktop.png',fullPage:false});
    fs.writeFileSync('_site/qa-v368-scene-presence.json',JSON.stringify({initial,editorial,tv,channel,leave},null,2));
    console.log(JSON.stringify({qa:'v368-scene-presence',viewport:'desktop',status:'PASS',initial,editorial,tv,channel,leave}));
    await page.close();

    const mobile=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:1});
    const mobileErrors=[];mobile.on('pageerror',e=>mobileErrors.push(String(e)));
    await mobile.goto('http://127.0.0.1:4173/',{waitUntil:'domcontentloaded',timeout:30000});
    await mobile.waitForFunction(()=>document.documentElement.dataset.crtScenePresence==='v368-ready',null,{timeout:20000});
    await mobile.waitForFunction(()=>document.querySelector('[data-model-slot="boot-tv"]')?.dataset.glbState==='ready',null,{timeout:20000});
    const mobileState=await mobile.evaluate(()=>{
      const root=document.documentElement,i=window.MOVX3D.runtime.instances['boot-tv'];
      return {coarse:i.scenePresence.state.coarse,mix:i.scenePresence.state.mix,inside:i.scenePresence.state.inside,presenceSurface:root.dataset.crtPresenceSurface||'',inputSurface:i.presence.state.inputSurface||'',renderers:document.querySelectorAll('.v322-model-renderer').length,activeSlots:window.MOVX3D.runtime.activeSlots,overflow:root.scrollWidth-innerWidth,errors:window.MOVX3D.runtime.errors};
    });
    assert.equal(mobileState.coarse,true);assert.ok(mobileState.mix<.01,'coarse pointer must not run continuous scene parallax');
    assert.equal(mobileState.presenceSurface,'v386.13-scene-field');assert.equal(mobileState.inputSurface,'scene-inner');
    assert.equal(mobileState.renderers,1);assert.deepEqual(mobileState.activeSlots,['boot-tv']);assert.ok(mobileState.overflow<=2);assert.equal(mobileState.errors.length,0);assert.equal(mobileErrors.length,0);
    await mobile.screenshot({path:'_site/qa-v368-scene-presence-mobile.png',fullPage:false});
    console.log(JSON.stringify({qa:'v368-scene-presence',viewport:'mobile',status:'PASS',mobileState}));
    await mobile.close();

    const reducedPage=await browser.newPage({viewport:{width:1280,height:800},reducedMotion:'reduce'});
    await reducedPage.goto('http://127.0.0.1:4173/',{waitUntil:'domcontentloaded',timeout:30000});
    await reducedPage.waitForFunction(()=>document.documentElement.dataset.crtScenePresence==='v368-ready',null,{timeout:20000});
    await reducedPage.waitForFunction(()=>document.querySelector('[data-model-slot="boot-tv"]')?.dataset.glbState==='ready',null,{timeout:20000});
    const scene=await reducedPage.locator('#boot .scene-inner').boundingBox();
    if(scene)await reducedPage.mouse.move(scene.x+scene.width*.8,scene.y+scene.height*.25,{steps:8});
    await reducedPage.waitForTimeout(240);
    const reducedState=await reducedPage.evaluate(()=>{const root=document.documentElement,i=window.MOVX3D.runtime.instances['boot-tv'];return {reduced:i.scenePresence.state.reduced,mix:i.scenePresence.state.mix,presenceSurface:root.dataset.crtPresenceSurface||'',inputSurface:i.presence.state.inputSurface||'',activeSlots:window.MOVX3D.runtime.activeSlots}});
    assert.equal(reducedState.reduced,true);assert.ok(reducedState.mix<.01,'reduced motion must suppress continuous scene presence');assert.equal(reducedState.presenceSurface,'v386.13-scene-field');assert.equal(reducedState.inputSurface,'scene-inner');assert.deepEqual(reducedState.activeSlots,['boot-tv']);
    console.log(JSON.stringify({qa:'v368-scene-presence',viewport:'reduced',status:'PASS',reducedState}));
    await reducedPage.close();
  } finally {await browser.close()}
})().catch(err=>{console.error(err);process.exit(1)});