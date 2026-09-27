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
    await page.waitForFunction(()=>{
      const s=document.querySelector('[data-model-slot="boot-tv"]')?.dataset.glbState;
      return s==='preview-ready'||s==='ready';
    },null,{timeout:6500});
    const first3dMs=Date.now()-started;

    const initial=await page.evaluate(()=>{
      const root=document.documentElement;
      const slot=document.querySelector('[data-model-slot="boot-tv"]');
      const inst=window.MOVX3D?.runtime?.instances?.['boot-tv'];
      return {
        immersion:root.dataset.crtImmersion,
        interactionReady:root.dataset.crtInteractionReady,
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
        overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth,
      };
    });
    assert.equal(initial.immersion,'v358-spatial-input');
    assert.equal(initial.interactionReady,'true');
    assert.equal(initial.rendererCount,1,'streaming preview must reuse the single Scene-01 renderer');
    assert.deepEqual(initial.activeSlots,['boot-tv']);
    assert.ok(initial.deferred.includes('hero-movx-logo')&&initial.deferred.includes('x-portal'),'later models escaped the deferred gate');
    assert.equal(initial.runtimeVersion,'v358-crt-spatial-runtime');
    assert.equal(initial.earlyFetch,true,'head-time CRT fetch did not start');
    assert.equal(initial.earlyBuffer,true,'shared early CRT ArrayBuffer promise missing');
    assert.equal(initial.lights,true,'v358 stage light handles missing');
    assert.ok(initial.overflow<=2,'desktop overflow regression');
    assert.ok(first3dMs<6500,`first interactive 3D took ${first3dMs}ms`);

    const motion=page.locator('[data-crt-mode-control="motion"]');
    await motion.hover();
    await page.waitForFunction(()=>{
      const root=document.documentElement;
      const yaw=parseFloat(getComputedStyle(root).getPropertyValue('--crt-mode-yaw'))||0;
      const ry=window.MOVX3D?.runtime?.instances?.['boot-tv']?.group?.rotation?.y||0;
      return document.querySelector('#boot')?.dataset.crtMode==='motion' && yaw>.09 && Math.abs(ry)>.018;
    },null,{timeout:2200,polling:'raf'});
    const hoverState=await page.evaluate(()=>({
      mode:document.querySelector('#boot')?.dataset.crtMode,
      yaw:parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--crt-mode-yaw'))||0,
      ry:window.MOVX3D?.runtime?.instances?.['boot-tv']?.group?.rotation?.y||0,
    }));
    assert.equal(hoverState.mode,'motion');
    assert.ok(hoverState.yaw>.09,'MOTION mode did not request a visible 3D yaw');
    assert.ok(Math.abs(hoverState.ry)>.018,'the Three.js group did not respond to mode hover');

    const ai=page.locator('[data-crt-mode-control="ai"]');
    await ai.click();
    await page.waitForFunction(()=>{
      const root=document.documentElement;
      const zoom=parseFloat(getComputedStyle(root).getPropertyValue('--crt-mode-zoom'))||0;
      const z=window.MOVX3D?.runtime?.instances?.['boot-tv']?.camera?.position?.z||9;
      return document.querySelector('#boot')?.dataset.crtMode==='ai' && zoom>=.17 && z<4.69;
    },null,{timeout:2200,polling:'raf'});
    const locked=await page.evaluate(()=>({
      mode:document.querySelector('#boot')?.dataset.crtMode,
      pressed:document.querySelector('[data-crt-mode-control="ai"]')?.getAttribute('aria-pressed'),
      zoom:parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--crt-mode-zoom'))||0,
      cameraZ:window.MOVX3D?.runtime?.instances?.['boot-tv']?.camera?.position?.z||0,
    }));
    assert.equal(locked.mode,'ai');
    assert.equal(locked.pressed,'true');
    assert.ok(locked.zoom>=.17,'AI mode zoom state missing');
    assert.ok(locked.cameraZ<4.69,'mode input is not affecting the actual PerspectiveCamera');

    const wrap=page.locator('#boot .crt-wrap');
    const box=await wrap.boundingBox();
    assert.ok(box&&box.width>100&&box.height>100,'CRT interaction surface has invalid bounds');
    await page.mouse.move(box.x+box.width*.50,box.y+box.height*.50);
    await page.mouse.down();
    await page.mouse.move(box.x+box.width*.72,box.y+box.height*.40,{steps:8});
    await page.waitForFunction(()=>{
      const root=document.documentElement;
      const dragYaw=parseFloat(getComputedStyle(root).getPropertyValue('--crt-drag-yaw'))||0;
      const pointerX=parseFloat(getComputedStyle(root).getPropertyValue('--crt-px'))||0;
      const rotationY=window.MOVX3D?.runtime?.instances?.['boot-tv']?.group?.rotation?.y||0;
      return Math.abs(dragYaw)>.02 && Math.abs(pointerX)>.15 && Math.abs(rotationY)>.035;
    },null,{timeout:2200,polling:'raf'});
    const dragState=await page.evaluate(()=>({
      dragging:document.querySelector('#boot .crt-wrap')?.classList.contains('is-crt-dragging'),
      dragYaw:parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--crt-drag-yaw'))||0,
      pointerX:parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--crt-px'))||0,
      rotationY:window.MOVX3D?.runtime?.instances?.['boot-tv']?.group?.rotation?.y||0,
    }));
    assert.equal(dragState.dragging,true);
    assert.ok(Math.abs(dragState.dragYaw)>.02,'live drag yaw did not reach the 3D runtime');
    assert.ok(Math.abs(dragState.pointerX)>.15,'pointer parallax signal did not reach the runtime');
    assert.ok(Math.abs(dragState.rotationY)>.035,'model rotation stayed effectively flat while dragging');
    await page.mouse.up();

    await page.waitForFunction(()=>document.querySelector('[data-model-slot="boot-tv"]')?.dataset.glbState==='ready',null,{timeout:12000});
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
    await mobile.waitForFunction(()=>{
      const s=document.querySelector('[data-model-slot="boot-tv"]')?.dataset.glbState;
      return s==='preview-ready'||s==='ready';
    },null,{timeout:8000});
    const digital=mobile.locator('[data-crt-mode-control="digital"]');
    await digital.tap();
    await mobile.waitForTimeout(180);
    const mobileState=await mobile.evaluate(()=>({
      mode:document.querySelector('#boot')?.dataset.crtMode,
      pressed:document.querySelector('[data-crt-mode-control="digital"]')?.getAttribute('aria-pressed'),
      coarse:matchMedia('(pointer:coarse)').matches,
      hintDisplay:getComputedStyle(document.querySelector('.crt-interaction-hint')).display,
      renderers:document.querySelectorAll('.v322-model-renderer').length,
      activeSlots:window.MOVX3D?.runtime?.activeSlots||[],
      overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth,
    }));
    assert.equal(mobileState.mode,'digital');
    assert.equal(mobileState.pressed,'true');
    assert.equal(mobileState.coarse,true,'mobile QA did not exercise the coarse-pointer runtime path');
    assert.equal(mobileState.hintDisplay,'none','desktop drag hint must stay out of mobile UI');
    assert.equal(mobileState.renderers,1);
    assert.deepEqual(mobileState.activeSlots,['boot-tv']);
    assert.ok(mobileState.overflow<=2,'mobile overflow regression');
    assert.equal(mobileErrors.length,0,'mobile page errors: '+mobileErrors.join(' | '));
    await mobile.screenshot({path:'_site/qa-v358-crt-immersion-mobile.png',fullPage:false});
    await mobile.close();

    console.log(JSON.stringify({qa:'v358-crt-immersion',status:'PASS',first3dMs,initial,hoverState,locked,dragState,finalState,mobileState}));
  } finally {
    await browser.close();
  }
})().catch(err=>{console.error(err);process.exit(1)});
