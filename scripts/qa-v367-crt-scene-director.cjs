const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');

(async()=>{
  const browser=await chromium.launch({headless:true,args:['--no-sandbox','--use-angle=swiftshader','--enable-webgl','--ignore-gpu-blocklist']});
  try{
    const page=await browser.newPage({viewport:{width:1440,height:1000},deviceScaleFactor:1});
    const errors=[];page.on('pageerror',e=>errors.push(String(e)));
    await page.goto('http://127.0.0.1:4173/',{waitUntil:'domcontentloaded',timeout:30000});
    await page.waitForFunction(()=>document.documentElement.dataset.crtDirector==='v367-ready',null,{timeout:20000});
    await page.waitForFunction(()=>document.querySelector('[data-model-slot="boot-tv"]')?.dataset.glbState==='ready',null,{timeout:20000});
    await page.waitForFunction(()=>document.documentElement.dataset.motionIntro==='ready',null,{timeout:12000});
    await page.waitForFunction(()=>Number(document.querySelector('#boot')?.dataset.v367Frame||0)>4,null,{timeout:5000});

    const initial=await page.evaluate(()=>{
      const root=document.documentElement,boot=document.querySelector('#boot');
      const r=window.MOVX3D.runtime,inst=r.instances['boot-tv'],director=inst.sceneDirector;
      const scene=boot.querySelector('.scene-inner').getBoundingClientRect();
      const panel=boot.querySelector('#crt-channel-panel').getBoundingClientRect();
      return {
        layer:root.dataset.crtDirectorLayer,
        ready:root.dataset.crtDirector,
        loop:root.dataset.crtDirectorLoop,
        channel:boot.dataset.v367Channel,
        beat:boot.dataset.v367Beat,
        dom:boot.dataset.v367Dom,
        frames:director.state.frames,
        camera:{x:inst.camera.position.x,y:inst.camera.position.y,z:inst.camera.position.z,fov:inst.camera.fov},
        base:{z:director.base.cameraZ,fov:director.base.fov},
        presence:director.state.presence,
        renderers:document.querySelectorAll('.v322-model-renderer').length,
        activeSlots:r.activeSlots,
        deferred:r.deferredSlots,
        triangles:inst.stats.triangles,
        panelInside:panel.bottom<=scene.bottom+1,
        panelHeight:panel.height,
        overflow:root.scrollWidth-innerWidth,
        errors:r.errors,
      };
    });
    assert.equal(initial.layer,'v367-scene01-director');
    assert.equal(initial.ready,'v367-ready');
    assert.equal(initial.loop,'shared-v322-frame');
    assert.equal(initial.renderers,1);
    assert.deepEqual(initial.activeSlots,['boot-tv']);
    assert.ok(initial.deferred.includes('hero-movx-logo')&&initial.deferred.includes('x-portal'),'later models escaped the gate');
    assert.equal(initial.triangles,44831);
    assert.equal(initial.panelInside,true,'v367 channel deck is clipped at first paint');
    assert.ok(initial.panelHeight<210,`v367 channel deck did not compact: ${initial.panelHeight}`);
    assert.ok(initial.overflow<=2);
    assert.equal(initial.errors.length,0);

    const wrap=page.locator('#boot .crt-wrap');
    const box=await wrap.boundingBox();assert.ok(box&&box.width>100&&box.height>100);
    await page.mouse.move(box.x+box.width*.67,box.y+box.height*.42,{steps:10});
    // The Scene-01 director intentionally uses damped camera motion. On a
    // SwiftShader CI runner the time required to converge can vary by hundreds
    // of milliseconds, so test the spatial result instead of sampling at an
    // arbitrary 220 ms instant.
    await page.waitForFunction((baselineX)=>{
      const inst=window.MOVX3D.runtime.instances['boot-tv'];
      const s=inst.sceneDirector.state;
      return s.presence>.25 && Math.abs(s.pointerX)>.05 && Math.abs(inst.camera.position.x-baselineX)>.006;
    },initial.camera.x,{timeout:6000,polling:'raf'});
    const pointer=await page.evaluate(()=>{
      const boot=document.querySelector('#boot'),inst=window.MOVX3D.runtime.instances['boot-tv'],s=inst.sceneDirector.state;
      return {
        presence:s.presence,pointerX:s.pointerX,pointerY:s.pointerY,
        camera:{x:inst.camera.position.x,y:inst.camera.position.y,z:inst.camera.position.z,fov:inst.camera.fov},
        lightX:getComputedStyle(boot).getPropertyValue('--v367-light-x').trim(),
        title:[...boot.querySelectorAll('.boot-title span')].map(el=>getComputedStyle(el).transform),
      };
    });
    assert.ok(pointer.presence>.25,'scene director did not inherit CRT pointer presence');
    assert.ok(Math.abs(pointer.pointerX)>.05,'scene director pointer x did not update');
    assert.ok(Math.abs(pointer.camera.x-initial.camera.x)>.006,'pointer did not move the camera enough to read as spatial');
    assert.ok(pointer.title.some(x=>x!=='none'),'headline did not join the Scene-01 depth response');

    await page.locator('[data-crt-mode-control="motion"]').click();
    await page.waitForFunction(()=>{
      const i=window.MOVX3D.runtime.instances['boot-tv'];
      return i.sceneDirector.state.channel==='motion'&&i.sceneDirector.state.channelMix>.75;
    },null,{timeout:5000});
    const motion=await page.evaluate(()=>{
      const boot=document.querySelector('#boot'),inst=window.MOVX3D.runtime.instances['boot-tv'],s=inst.sceneDirector.state;
      return {channel:boot.dataset.v367Channel,screen:inst.channels.state.channel,energy:s.energy,warm:s.warm,fov:inst.camera.fov,physical:boot.dataset.crtPhysicalChannel};
    });
    assert.equal(motion.channel,'motion');assert.equal(motion.screen,'motion');assert.equal(motion.physical,'motion');
    assert.ok(motion.energy>.55,'motion channel did not propagate into scene energy');
    assert.ok(Math.abs(motion.fov-initial.base.fov)>.18,'motion channel did not affect the camera signature');

    const scrollState=await page.evaluate(async()=>{
      document.documentElement.style.scrollBehavior='auto';document.body.style.scrollBehavior='auto';
      const boot=document.querySelector('#boot');const travel=Math.max(1,boot.offsetHeight-innerHeight);
      const target=Math.round(boot.offsetTop+travel*.62);scrollTo({top:target,left:0,behavior:'instant'});await new Promise(r=>setTimeout(r,500));
      return {target,scrollY,travel};
    });
    await page.waitForFunction(()=>window.MOVX3D.runtime.instances['boot-tv'].sceneDirector.state.progress>.42,null,{timeout:7000});
    const scroll=await page.evaluate(()=>{
      const boot=document.querySelector('#boot'),inst=window.MOVX3D.runtime.instances['boot-tv'],s=inst.sceneDirector.state;
      return {progress:s.progress,beat:boot.dataset.v367Beat,cameraZ:inst.camera.position.z,baseZ:inst.sceneDirector.base.cameraZ,engage:getComputedStyle(boot).getPropertyValue('--v367-engage').trim(),overflow:document.documentElement.scrollWidth-innerWidth};
    });
    assert.ok(scroll.progress>.42,'scroll was not consumed by the Scene-01 director');
    assert.ok(Math.abs(scroll.cameraZ-scroll.baseZ)>.035,'scroll did not create a real camera path');
    assert.ok(scroll.overflow<=2);

    await page.evaluate(async()=>{
      const boot=document.querySelector('#boot');const travel=Math.max(1,boot.offsetHeight-innerHeight);
      scrollTo({top:Math.round(boot.offsetTop+travel*.94),left:0,behavior:'instant'});await new Promise(r=>setTimeout(r,550));
    });
    await page.waitForFunction(()=>window.MOVX3D.runtime.instances['boot-tv'].sceneDirector.state.progress>.80,null,{timeout:7000});
    const handoff=await page.evaluate(()=>{
      const boot=document.querySelector('#boot'),s=window.MOVX3D.runtime.instances['boot-tv'].sceneDirector.state;
      return {beat:boot.dataset.v367Beat,progress:s.progress,handoff:parseFloat(getComputedStyle(boot).getPropertyValue('--v367-handoff')||0)};
    });
    assert.equal(handoff.beat,'handoff');assert.ok(handoff.handoff>.05,'handoff composition did not activate');
    assert.equal(errors.length,0,'page errors: '+errors.join(' | '));
    await page.screenshot({path:'_site/qa-v367-scene-director-desktop.png',fullPage:false});
    fs.writeFileSync('_site/qa-v367-scene-director.json',JSON.stringify({initial,pointer,motion,scrollState,scroll,handoff},null,2));
    console.log(JSON.stringify({qa:'v367-scene01-director',status:'PASS',initial,pointer,motion,scroll,handoff}));
    await page.close();

    const mobile=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:1});
    await mobile.goto('http://127.0.0.1:4173/',{waitUntil:'domcontentloaded',timeout:30000});
    await mobile.waitForFunction(()=>document.documentElement.dataset.crtDirector==='v367-ready',null,{timeout:20000});
    await mobile.locator('[data-crt-mode-control="digital"]').click();await mobile.waitForTimeout(250);
    const mobileState=await mobile.evaluate(()=>{
      const boot=document.querySelector('#boot'),scene=boot.querySelector('.scene-inner').getBoundingClientRect(),panel=boot.querySelector('#crt-channel-panel').getBoundingClientRect();
      const inst=window.MOVX3D.runtime.instances['boot-tv'];
      return {channel:inst.sceneDirector.state.channel,presence:inst.sceneDirector.state.presence,coarse:inst.sceneDirector.state.coarse,panelInside:panel.bottom<=scene.bottom+1,renderers:document.querySelectorAll('.v322-model-renderer').length,activeSlots:window.MOVX3D.runtime.activeSlots,overflow:document.documentElement.scrollWidth-innerWidth};
    });
    assert.equal(mobileState.channel,'digital');assert.equal(mobileState.coarse,true);assert.ok(mobileState.presence<.05,'mobile should not run hover camera parallax');
    assert.equal(mobileState.panelInside,true);assert.equal(mobileState.renderers,1);assert.deepEqual(mobileState.activeSlots,['boot-tv']);assert.ok(mobileState.overflow<=2);
    await mobile.screenshot({path:'_site/qa-v367-scene-director-mobile.png',fullPage:false});await mobile.close();

    const reducedPage=await browser.newPage({viewport:{width:1280,height:800},reducedMotion:'reduce'});
    await reducedPage.goto('http://127.0.0.1:4173/',{waitUntil:'domcontentloaded',timeout:30000});
    await reducedPage.waitForFunction(()=>document.documentElement.dataset.crtDirector==='v367-ready',null,{timeout:20000});
    const reducedState=await reducedPage.evaluate(()=>{const i=window.MOVX3D.runtime.instances['boot-tv'];return {reduced:i.sceneDirector.state.reduced,presence:i.sceneDirector.state.presence,activeSlots:window.MOVX3D.runtime.activeSlots}});
    assert.equal(reducedState.reduced,true);assert.ok(reducedState.presence<.01);assert.deepEqual(reducedState.activeSlots,['boot-tv']);await reducedPage.close();
  } finally {await browser.close()}
})().catch(err=>{console.error(err);process.exit(1)});
