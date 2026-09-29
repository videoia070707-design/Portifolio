const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');

(async()=>{
  const models=fs.readdirSync('_site/models').filter(x=>x.toLowerCase().endsWith('.glb')).sort();
  assert.deepEqual(models,['movx-crt-tv.glb'],'v358 must publish exactly one production GLB');

  const browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-webgl','--ignore-gpu-blocklist']});
  try{
    const page=await browser.newPage({viewport:{width:1440,height:1000},deviceScaleFactor:1});
    const errors=[];page.on('pageerror',e=>errors.push(String(e)));
    const started=Date.now();
    await page.goto('http://127.0.0.1:4173/',{waitUntil:'domcontentloaded',timeout:30000});
    await page.waitForFunction(()=>document.documentElement.dataset.crtInteractionReady==='true',null,{timeout:7000});
    // v366 intentionally removed the old procedural preview-ready path. The
    // authored real-TV poster owns first paint while the actual GLB decodes, so
    // this immersion contract waits for the real renderer instead of requiring
    // a synthetic preview within 6.5s on SwiftShader CI runners.
    await page.waitForFunction(()=>document.querySelector('[data-model-slot="boot-tv"]')?.dataset.glbState==='ready',null,{timeout:20000});
    const first3dMs=Date.now()-started;

    const initial=await page.evaluate(()=>{
      const root=document.documentElement;
      const slot=document.querySelector('[data-model-slot="boot-tv"]');
      const inst=window.MOVX3D?.runtime?.instances?.['boot-tv'];
      return {
        immersion:root.dataset.crtImmersion,
        interactionReady:root.dataset.crtInteractionReady,
        pointerReady:root.dataset.crtPointerReady,
        assetState:root.dataset.crtAssetState||'',
        glbState:slot?.dataset.glbState||'',
        modelKind:slot?.dataset.modelKind||'',
        rendererCount:document.querySelectorAll('.v322-model-renderer').length,
        activeSlots:window.MOVX3D?.runtime?.activeSlots||[],
        deferred:window.MOVX3D?.runtime?.deferredSlots||[],
        runtimeVersion:window.MOVX3D?.runtime?.version||'',
        earlyFetch:typeof window.__MOVX_CRT_FETCH_STARTED__==='number',
        earlyBuffer:!!window.__MOVX_CRT_BUFFER__,
        lights:!!inst?.lights,
        director:root.dataset.crtDirector||'',
        overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth,
      };
    });
    assert.equal(initial.immersion,'v358-spatial-input');
    assert.equal(initial.interactionReady,'true');
    assert.equal(initial.pointerReady,'true','desktop cursor interaction owner missing');
    assert.equal(initial.glbState,'ready','immersion test must run against the real CRT GLB');
    assert.equal(initial.rendererCount,1,'Scene 01 must reuse the single CRT renderer');
    assert.deepEqual(initial.activeSlots,['boot-tv']);
    assert.ok(initial.deferred.includes('hero-movx-logo')&&initial.deferred.includes('x-portal'),'later models escaped the deferred gate');
    assert.equal(initial.runtimeVersion,'v358-crt-spatial-runtime');
    assert.equal(initial.earlyFetch,true,'head-time CRT fetch did not start');
    assert.equal(initial.earlyBuffer,true,'shared early CRT ArrayBuffer promise missing');
    assert.equal(initial.lights,true,'v358 stage light handles missing');
    assert.equal(initial.director,'v367-ready','v367 Scene-01 director did not attach to the real CRT');
    assert.ok(initial.overflow<=2,'desktop overflow regression');
    assert.ok(first3dMs<20000,`real interactive CRT took ${first3dMs}ms and exceeded the hard CI ceiling`);

    const motion=page.locator('[data-crt-mode-control="motion"]');
    await motion.hover();
    assert.equal(await page.locator('#boot').getAttribute('data-crt-mode'),'direction','Hover must not retune the TV');
    await motion.click();
    await page.waitForFunction(()=>window.MOVX3D.runtime.instances['boot-tv'].channels?.state.channel==='motion',null,{timeout:15000});
    const hoverState={deliberateSelection:true};
    await page.locator('[data-crt-mode-control="ai"]').click();
    await page.waitForFunction(()=>window.MOVX3D.runtime.instances['boot-tv'].channels?.state.channel==='ai');
    const locked=await page.evaluate(()=>({rotationY:window.MOVX3D.runtime.instances['boot-tv'].group.rotation.y}));

    const wrap=page.locator('#boot .crt-wrap');
    const box=await wrap.boundingBox();
    assert.ok(box&&box.width>100&&box.height>100,'CRT interaction surface has invalid bounds');
    await page.mouse.move(box.x+box.width*.72,box.y+box.height*.40,{steps:8});
    await page.waitForFunction((baseline)=>{
      const root=document.documentElement;
      const pointerX=parseFloat(getComputedStyle(root).getPropertyValue('--crt-px'))||0;
      const rotationY=window.MOVX3D?.runtime?.instances?.['boot-tv']?.group?.rotation?.y||0;
      return Math.abs(pointerX)>.15 && Math.abs(rotationY-baseline)>.004;
    },locked.rotationY,{timeout:8000,polling:'raf'});
    const pointerState=await page.evaluate((baseline)=>({
      pointerReady:document.documentElement.dataset.crtPointerReady,
      pointerX:parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--crt-px'))||0,
      pointerY:parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--crt-py'))||0,
      rotationY:window.MOVX3D?.runtime?.instances?.['boot-tv']?.group?.rotation?.y||0,
      deltaY:(window.MOVX3D?.runtime?.instances?.['boot-tv']?.group?.rotation?.y||0)-baseline,
      cameraX:window.MOVX3D?.runtime?.instances?.['boot-tv']?.camera?.position?.x||0,
    }),locked.rotationY);
    assert.equal(pointerState.pointerReady,'true');
    assert.ok(Math.abs(pointerState.pointerX)>.15,'cursor parallax signal did not reach the runtime');
    assert.ok(Math.abs(pointerState.deltaY)>.004,'real Three.js model did not react to cursor parallax');
    assert.ok(Math.abs(pointerState.cameraX)>.005,'v367 camera did not join the pointer response');

    await page.waitForTimeout(260);
    const finalState=await page.evaluate(()=>{
      const root=document.documentElement;
      const slot=document.querySelector('[data-model-slot="boot-tv"]');
      const inst=window.MOVX3D?.runtime?.instances?.['boot-tv'];
      return {
        kind:slot?.dataset.modelKind,
        crt3d:root.dataset.crt3d,
        decode:root.dataset.crtDecode,
        source:root.dataset.crtSource,
        version:inst?.stats?.version,
        immersionVersion:inst?.stats?.immersionVersion,
        streamingProxy:inst?.stats?.streamingProxy,
        renderers:document.querySelectorAll('.v322-model-renderer').length,
        errors:window.MOVX3D?.runtime?.errors||[],
        overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth,
      };
    });
    assert.equal(finalState.kind,'glb');
    assert.equal(finalState.crt3d,'glb-ready');
    assert.equal(finalState.decode,'ready');
    assert.equal(finalState.source,'v352-standalone-vintage-computer');
    assert.equal(finalState.version,'v352-standalone-crt');
    assert.equal(finalState.immersionVersion,'v358-crt-spatial');
    assert.equal(finalState.streamingProxy,false);
    assert.equal(finalState.renderers,1);
    assert.equal(finalState.errors.length,0,'runtime errors: '+JSON.stringify(finalState.errors));
    assert.ok(finalState.overflow<=2,'desktop final overflow regression');
    assert.equal(errors.length,0,'desktop page errors: '+errors.join(' | '));
    await page.screenshot({path:'_site/qa-v358-crt-immersion-desktop.png',fullPage:false});
    await page.close();

    const mobile=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1,hasTouch:true,isMobile:true});
    const mobileErrors=[];mobile.on('pageerror',e=>mobileErrors.push(String(e)));
    await mobile.goto('http://127.0.0.1:4173/',{waitUntil:'domcontentloaded',timeout:30000});
    await mobile.waitForFunction(()=>document.documentElement.dataset.crtInteractionReady==='true',null,{timeout:7000});
    await mobile.waitForFunction(()=>document.querySelector('[data-model-slot="boot-tv"]')?.dataset.glbState==='ready',null,{timeout:20000});
    const digital=mobile.locator('[data-crt-mode-control="digital"]');
    await digital.tap();
    await mobile.waitForTimeout(180);
    const mobileState=await mobile.evaluate(()=>({
      mode:document.querySelector('#boot')?.dataset.crtMode,
      pressed:document.querySelector('[data-crt-mode-control="digital"]')?.getAttribute('aria-pressed'),
      coarse:matchMedia('(pointer:coarse)').matches,
      pointerReady:document.documentElement.dataset.crtPointerReady,
      hintDisplay:getComputedStyle(document.querySelector('.crt-interaction-hint')).display,
      director:document.documentElement.dataset.crtDirector,
      renderers:document.querySelectorAll('.v322-model-renderer').length,
      activeSlots:window.MOVX3D?.runtime?.activeSlots||[],
      overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth,
    }));
    assert.equal(mobileState.mode,'digital');
    assert.equal(mobileState.pressed,'true');
    assert.equal(mobileState.coarse,true,'mobile QA did not exercise the coarse-pointer runtime path');
    assert.equal(mobileState.pointerReady,'false','coarse devices must not run cursor parallax');
    assert.equal(mobileState.hintDisplay,'none','desktop cursor hint must stay out of mobile UI');
    assert.equal(mobileState.director,'v367-ready');
    assert.equal(mobileState.renderers,1);
    assert.deepEqual(mobileState.activeSlots,['boot-tv']);
    assert.ok(mobileState.overflow<=2,'mobile overflow regression');
    assert.equal(mobileErrors.length,0,'mobile page errors: '+mobileErrors.join(' | '));
    await mobile.screenshot({path:'_site/qa-v358-crt-immersion-mobile.png',fullPage:false});
    await mobile.close();

    console.log(JSON.stringify({qa:'v358-crt-immersion',status:'PASS',first3dMs,initial,hoverState,locked,pointerState,finalState,mobileState}));
  } finally {
    await browser.close();
  }
})().catch(err=>{console.error(err);process.exit(1)});
