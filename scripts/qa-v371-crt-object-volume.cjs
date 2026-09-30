const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');

(async()=>{
  const models=fs.readdirSync('_site/models').filter(x=>x.toLowerCase().endsWith('.glb')).sort();
  assert.deepEqual(models,['movx-crt-tv.glb'],'v371 must keep exactly one production GLB');

  const browser=await chromium.launch({headless:true,args:['--no-sandbox','--use-angle=swiftshader','--enable-webgl','--ignore-gpu-blocklist']});
  try{
    const page=await browser.newPage({viewport:{width:1440,height:1000},deviceScaleFactor:1});
    const errors=[];page.on('pageerror',e=>errors.push(String(e)));
    await page.goto('http://127.0.0.1:4173/',{waitUntil:'domcontentloaded',timeout:30000});
    await page.waitForFunction(()=>document.querySelector('[data-model-slot="boot-tv"]')?.dataset.glbState==='ready',null,{timeout:25000});
    await page.waitForFunction(()=>document.documentElement.dataset.crtObjectVolume==='v371-ready',null,{timeout:12000});
    /* Do not gate this physical behavior on a fixed number of rAF ticks. Software
       WebGL runners can throttle frame delivery even when the runtime is healthy.
       Wait for the actual authored three-quarter pose to converge instead. */
    await page.waitForFunction(()=>{
      const s=window.MOVX3D?.runtime?.instances?.['boot-tv']?.objectVolume?.state;
      return !!s && s.channel==='direction' && s.restYaw<-.025 && s.yaw<-.018;
    },null,{timeout:12000,polling:'raf'});

    const initial=await page.evaluate(()=>{
      const root=document.documentElement,boot=document.querySelector('#boot');
      const inst=window.MOVX3D.runtime.instances['boot-tv'];
      const s=inst.objectVolume.state;
      return {
        layer:root.dataset.crtObjectVolumeLayer,
        ready:root.dataset.crtObjectVolume,
        loop:root.dataset.crtObjectVolumeLoop,
        channel:s.channel,
        yaw:s.yaw,restYaw:s.restYaw,pitch:s.pitch,depth:s.depth,idleYaw:s.idleYaw,
        groupYaw:inst.group.rotation.y,groupPitch:inst.group.rotation.x,
        frames:s.frames,
        renderers:document.querySelectorAll('.v322-model-renderer').length,
        activeSlots:window.MOVX3D.runtime.activeSlots,
        deferred:window.MOVX3D.runtime.deferredSlots,
        triangles:inst.stats.triangles,
        overflow:root.scrollWidth-innerWidth,
        errors:window.MOVX3D.runtime.errors,
      };
    });
    assert.equal(initial.layer,'v371-object-volume');
    assert.equal(initial.ready,'v371-ready');
    assert.equal(initial.loop,'shared-v322-frame');
    assert.equal(initial.channel,'direction');
    assert.ok(initial.frames>0,'v371 object-volume runtime never entered the shared frame');
    assert.ok(initial.restYaw<-.025,`direction rest pose is too flat: ${initial.restYaw}`);
    assert.ok(initial.yaw<-.018,`real CRT did not settle into a visible three-quarter pose: ${initial.yaw}`);
    assert.ok(Math.abs(initial.groupYaw)>.045,`final real CRT group still reads front-flat: ${initial.groupYaw}`);
    assert.equal(initial.renderers,1);assert.deepEqual(initial.activeSlots,['boot-tv']);
    assert.ok(initial.deferred.includes('hero-movx-logo')&&initial.deferred.includes('x-portal'));
    assert.equal(initial.triangles,44831);assert.ok(initial.overflow<=2);assert.equal(initial.errors.length,0);
    await page.screenshot({path:'_site/qa-v371-crt-object-volume-desktop.png',fullPage:false});

    /* Move over the editorial copy rather than the television. v371 must reuse
       v368 scene-wide presence so the physical object acknowledges the visitor
       across the whole Scene 01, not only when the cursor hits the mesh. */
    const copy=page.locator('#boot .boot-copy');
    const copyBox=await copy.boundingBox();assert.ok(copyBox&&copyBox.width>100&&copyBox.height>100);
    await page.mouse.move(copyBox.x+copyBox.width*.84,copyBox.y+copyBox.height*.46,{steps:12});
    await page.waitForFunction(()=>{
      const inst=window.MOVX3D.runtime.instances['boot-tv'];
      return inst.scenePresence.state.mix>.55 && inst.objectVolume.state.pointerYaw>.012;
    },null,{timeout:8000,polling:'raf'});
    const sceneAware=await page.evaluate(()=>{
      const inst=window.MOVX3D.runtime.instances['boot-tv'];
      return {
        sceneMix:inst.scenePresence.state.mix,
        sceneX:inst.scenePresence.state.x,
        pointerYaw:inst.objectVolume.state.pointerYaw,
        pointerPitch:inst.objectVolume.state.pointerPitch,
        groupYaw:inst.group.rotation.y,
        presenceSource:document.querySelector('#boot').dataset.v367PresenceSource,
      };
    });
    assert.ok(sceneAware.sceneMix>.55);assert.ok(sceneAware.sceneX>.15);
    assert.ok(sceneAware.pointerYaw>.012,'copy-side pointer did not create real object yaw');
    assert.ok(Math.abs(sceneAware.groupYaw-initial.groupYaw)>.012,'real CRT group did not react to scene-wide pointer');
    assert.equal(sceneAware.presenceSource,'scene');

    /* Channel selection must change the cabinet presentation, not only the screen.
       A channel change is intentionally damped by three independent physical
       layers. Wait until v365 physics, v367 director and v371 volume converge to
       the same MOTION pose before judging which cabinet side is exposed. */
    await page.locator('[data-crt-mode-control="motion"]').click();
    const scene=page.locator('#boot .scene-inner');const sceneBox=await scene.boundingBox();
    await page.mouse.move(sceneBox.x+sceneBox.width*.50,sceneBox.y+sceneBox.height*.52,{steps:8});
    await page.waitForFunction(()=>{
      const inst=window.MOVX3D.runtime.instances['boot-tv'];
      const volume=inst.objectVolume?.state;
      const physics=inst.channelPhysics?.state;
      const director=inst.sceneDirector?.state;
      return volume?.channel==='motion' && volume.restYaw>.02 && volume.yaw>.018 && Math.abs(volume.pointerYaw)<.012 &&
        physics?.channel==='motion' && physics.yaw>.018 &&
        director?.channel==='motion' && director.channelMix>.80 &&
        inst.group.rotation.y>.035;
    },null,{timeout:12000,polling:'raf'});
    const motion=await page.evaluate(()=>{
      const inst=window.MOVX3D.runtime.instances['boot-tv'];
      const s=inst.objectVolume.state;
      return {
        channel:s.channel,restYaw:s.restYaw,yaw:s.yaw,groupYaw:inst.group.rotation.y,
        physical:document.querySelector('#boot').dataset.crtPhysicalChannel,
        screen:inst.channels.state.channel,
        physicsYaw:inst.channelPhysics.state.yaw,
        directorMix:inst.sceneDirector.state.channelMix,
      };
    });
    assert.equal(motion.channel,'motion');assert.equal(motion.physical,'motion');assert.equal(motion.screen,'motion');
    assert.ok(motion.restYaw>.02);assert.ok(motion.physicsYaw>.018);assert.ok(motion.directorMix>.80);
    assert.ok(motion.groupYaw>.035,`MOTION did not expose the opposite cabinet side after convergence: ${motion.groupYaw}`);

    /* Direct manipulation has priority. v371 must quickly fade its authored pose
       instead of fighting the user's cabinet drag. */
    const authoredMagnitude=Math.abs(motion.yaw);
    await page.evaluate(()=>{window.MOVX3D.runtime.instances['boot-tv'].objectInteraction.state.active=true});
    await page.waitForFunction(()=>{
      const s=window.MOVX3D.runtime.instances['boot-tv'].objectVolume.state;
      return s.manualPriority===1 && Math.abs(s.yaw)<.012;
    },null,{timeout:5000,polling:'raf'});
    const manual=await page.evaluate(()=>{const s=window.MOVX3D.runtime.instances['boot-tv'].objectVolume.state;return {manualPriority:s.manualPriority,yaw:s.yaw,marker:document.querySelector('#boot').dataset.v371Manual}});
    assert.equal(manual.manualPriority,1);assert.equal(manual.marker,'true');assert.ok(Math.abs(manual.yaw)<authoredMagnitude*.55);
    await page.evaluate(()=>{window.MOVX3D.runtime.instances['boot-tv'].objectInteraction.state.active=false});

    assert.equal(errors.length,0,'desktop page errors: '+errors.join(' | '));
    console.log(JSON.stringify({qa:'v371-crt-object-volume',viewport:'desktop',status:'PASS',initial,sceneAware,motion,manual}));
    await page.close();

    const mobile=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:1});
    await mobile.goto('http://127.0.0.1:4173/',{waitUntil:'domcontentloaded',timeout:30000});
    await mobile.waitForFunction(()=>document.querySelector('[data-model-slot="boot-tv"]')?.dataset.glbState==='ready',null,{timeout:25000});
    await mobile.waitForFunction(()=>document.documentElement.dataset.crtObjectVolume==='v371-ready',null,{timeout:12000});
    await mobile.waitForFunction(()=>{
      const s=window.MOVX3D?.runtime?.instances?.['boot-tv']?.objectVolume?.state;
      return !!s && s.coarse===true && Math.abs(s.restYaw)>.015;
    },null,{timeout:10000,polling:'raf'});
    const mobileState=await mobile.evaluate(()=>{const root=document.documentElement,inst=window.MOVX3D.runtime.instances['boot-tv'],s=inst.objectVolume.state;return {coarse:s.coarse,reduced:s.reduced,restYaw:s.restYaw,pointerYaw:s.pointerYaw,idleYaw:s.idleYaw,frames:s.frames,groupYaw:inst.group.rotation.y,renderers:document.querySelectorAll('.v322-model-renderer').length,activeSlots:window.MOVX3D.runtime.activeSlots,overflow:root.scrollWidth-innerWidth}});
    assert.equal(mobileState.coarse,true);assert.equal(mobileState.reduced,false);assert.equal(mobileState.pointerYaw,0);assert.equal(mobileState.idleYaw,0);assert.ok(mobileState.frames>0);
    assert.ok(Math.abs(mobileState.restYaw)>.015,'mobile static CRT pose is still flat');assert.equal(mobileState.renderers,1);assert.deepEqual(mobileState.activeSlots,['boot-tv']);assert.ok(mobileState.overflow<=2);
    console.log(JSON.stringify({qa:'v371-crt-object-volume',viewport:'mobile',status:'PASS',mobileState}));
    await mobile.close();

    const reducedPage=await browser.newPage({viewport:{width:1280,height:800},reducedMotion:'reduce'});
    await reducedPage.goto('http://127.0.0.1:4173/',{waitUntil:'domcontentloaded',timeout:30000});
    await reducedPage.waitForFunction(()=>document.querySelector('[data-model-slot="boot-tv"]')?.dataset.glbState==='ready',null,{timeout:25000});
    await reducedPage.waitForFunction(()=>document.documentElement.dataset.crtObjectVolume==='v371-ready',null,{timeout:12000});
    await reducedPage.waitForFunction(()=>{
      const s=window.MOVX3D?.runtime?.instances?.['boot-tv']?.objectVolume?.state;
      return !!s && s.reduced===true && Math.abs(s.restYaw)>.025;
    },null,{timeout:10000,polling:'raf'});
    const reducedState=await reducedPage.evaluate(()=>{const root=document.documentElement,inst=window.MOVX3D.runtime.instances['boot-tv'],s=inst.objectVolume.state;return {reduced:s.reduced,restYaw:s.restYaw,pointerYaw:s.pointerYaw,idleYaw:s.idleYaw,frames:s.frames,renderers:document.querySelectorAll('.v322-model-renderer').length,activeSlots:window.MOVX3D.runtime.activeSlots,overflow:root.scrollWidth-innerWidth}});
    assert.equal(reducedState.reduced,true);assert.equal(reducedState.pointerYaw,0);assert.equal(reducedState.idleYaw,0);assert.ok(reducedState.frames>0);assert.ok(Math.abs(reducedState.restYaw)>.025);assert.equal(reducedState.renderers,1);assert.deepEqual(reducedState.activeSlots,['boot-tv']);assert.ok(reducedState.overflow<=2);
    console.log(JSON.stringify({qa:'v371-crt-object-volume',viewport:'reduced',status:'PASS',reducedState}));
    await reducedPage.close();
  } finally {await browser.close()}
})().catch(err=>{console.error(err);process.exit(1)});
