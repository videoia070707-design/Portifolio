const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');

(async()=>{
  const fixture='_site/qa-v322-model.gltf';
  const browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-webgl','--ignore-gpu-blocklist']});
  try{
    // Replacement-path QA: an explicit CRT GLB must still replace the procedural model.
    const page=await browser.newPage({viewport:{width:1440,height:1000},deviceScaleFactor:1});
    const errors=[];page.on('pageerror',e=>errors.push(String(e)));
    await page.goto('http://127.0.0.1:4173/?crtModel=qa-v322-model.gltf',{waitUntil:'domcontentloaded',timeout:30000});
    await page.waitForFunction(()=>document.documentElement.dataset.v322Glb==='ready',null,{timeout:10000});
    await page.waitForFunction(()=>document.querySelector('[data-model-slot="boot-tv"]')?.dataset.glbState==='ready',null,{timeout:20000});
    const state=await page.evaluate(()=>{
      const el=document.querySelector('[data-model-slot="boot-tv"]');
      const inst=window.MOVX3D?.runtime?.instances?.['boot-tv'];
      return {
        production:document.documentElement.dataset.movxProduction,
        runtime:document.documentElement.dataset.glbRuntime,
        rootState:document.documentElement.dataset.v322Glb,
        requested:document.documentElement.dataset.v322Requested,
        scope:document.documentElement.dataset.movx3dScope,
        slotState:el.dataset.glbState,
        kind:el.dataset.modelKind,
        canvas:!!el.querySelector('.v322-model-renderer canvas'),
        active:el.classList.contains('v322-runtime-active'),
        triangles:inst?.stats?.triangles,
        meshes:inst?.stats?.meshes,
        errors:window.MOVX3D?.runtime?.errors||[],
        contextLimit:window.MOVX3D?.runtime?.contextLimit,
        activeSlots:window.MOVX3D?.runtime?.activeSlots||[],
        singleModelMode:!!window.MOVX3D?.runtime?.singleModelMode,
      };
    });
    assert.equal(state.production,'v321-production-storyboard');
    assert.equal(state.runtime,'v322-unified-glb-runtime');
    assert.equal(state.rootState,'ready');
    assert.equal(state.scope,'boot-tv');
    assert.equal(state.requested,'1');
    assert.equal(state.slotState,'ready');
    assert.equal(state.kind,'glb');
    assert.ok(state.canvas&&state.active,'CRT GLB fixture renderer did not mount');
    assert.equal(state.triangles,1,'QA glTF triangle count mismatch');
    assert.equal(state.meshes,1,'QA glTF mesh count mismatch');
    assert.equal(state.errors.length,0,'runtime errors: '+JSON.stringify(state.errors));
    assert.deepEqual(state.activeSlots,['boot-tv']);
    assert.equal(state.singleModelMode,true,'single-model runtime gate missing');
    assert.ok([2,3].includes(state.contextLimit),'context limit not installed');
    assert.equal(errors.length,0,'page errors: '+errors.join(' | '));
    const loader=await page.request.get('http://127.0.0.1:4173/vendor/three-addons/loaders/GLTFLoader.js');
    assert.equal(loader.status(),200,'local GLTFLoader module missing');
    await page.screenshot({path:'_site/qa-v322-glb-desktop.png',fullPage:false});
    await page.close();

    // Production-path QA: without the final GLB, the first slot must render the
    // real procedural WebGL CRT. Later storyboard models remain deferred.
    const prod=await browser.newPage({viewport:{width:1440,height:1000},deviceScaleFactor:1});
    const prodErrors=[];prod.on('pageerror',e=>prodErrors.push(String(e)));
    await prod.goto('http://127.0.0.1:4173/',{waitUntil:'domcontentloaded',timeout:30000});
    await prod.waitForFunction(()=>document.documentElement.dataset.v322Glb==='ready',null,{timeout:10000});
    await prod.waitForFunction(()=>document.querySelector('[data-model-slot="boot-tv"]')?.dataset.glbState==='ready',null,{timeout:20000});
    const productionState=await prod.evaluate(()=>{
      const el=document.querySelector('[data-model-slot="boot-tv"]');
      const inst=window.MOVX3D?.runtime?.instances?.['boot-tv'];
      return {
        requested:document.documentElement.dataset.v322Requested,
        scope:document.documentElement.dataset.modelScope,
        runtimeScope:document.documentElement.dataset.movx3dScope,
        crt3d:document.documentElement.dataset.crt3d,
        renderers:document.querySelectorAll('.v322-model-renderer').length,
        instances:Object.keys(window.MOVX3D?.runtime?.instances||{}).sort(),
        awaiting:window.MOVX3D?.runtime?.awaitingSlots||[],
        deferred:window.MOVX3D?.runtime?.deferredSlots||[],
        overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth,
        manifest:window.MOVX3D_MODELS||{},
        bootState:el?.dataset.glbState||null,
        kind:el?.dataset.modelKind||null,
        canvas:!!el?.querySelector('.v322-model-renderer canvas'),
        meshes:inst?.stats?.meshes||0,
        triangles:inst?.stats?.triangles||0,
        version:inst?.stats?.version||null,
        runtimeErrors:window.MOVX3D?.runtime?.errors||[],
      };
    });
    assert.equal(productionState.requested,'1','procedural CRT should register as the one active model');
    assert.equal(productionState.scope,'v348-crt-only','production model scope marker mismatch');
    assert.equal(productionState.runtimeScope,'boot-tv','runtime scope must be the first storyboard slot');
    assert.deepEqual(productionState.instances,['boot-tv'],'only the first storyboard model may be registered');
    assert.equal(Object.keys(productionState.manifest).length,0,'later GLBs leaked into production manifest');
    assert.ok(productionState.awaiting.includes('boot-tv'),'CRT should still be marked as awaiting final GLB');
    assert.equal(productionState.bootState,'ready','procedural CRT did not become ready');
    assert.equal(productionState.kind,'procedural-crt','wrong production CRT renderer kind');
    assert.equal(productionState.crt3d,'procedural-ready','root procedural CRT state mismatch');
    assert.equal(productionState.renderers,1,'production should mount exactly one 3D renderer');
    assert.ok(productionState.canvas,'procedural CRT canvas missing');
    assert.ok(productionState.meshes>=20,'procedural CRT is unexpectedly sparse');
    assert.ok(productionState.triangles>100,'procedural CRT geometry did not build');
    assert.equal(productionState.version,'v348','procedural CRT version mismatch');
    assert.ok(productionState.deferred.includes('hero-movx-logo'),'Physical Logo must remain deferred');
    assert.ok(productionState.deferred.includes('x-portal'),'X Portal must remain deferred');
    assert.ok(productionState.overflow<=2,'production desktop overflow regression');
    assert.equal(productionState.runtimeErrors.length,0,'production runtime errors: '+JSON.stringify(productionState.runtimeErrors));
    assert.equal(prodErrors.length,0,'production page errors: '+prodErrors.join(' | '));
    await prod.screenshot({path:'_site/qa-v348-crt-procedural-desktop.png',fullPage:false});
    await prod.close();

    // Mobile smoke test for the same first model.
    const mobile=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1});
    const mobileErrors=[];mobile.on('pageerror',e=>mobileErrors.push(String(e)));
    await mobile.goto('http://127.0.0.1:4173/',{waitUntil:'domcontentloaded',timeout:30000});
    await mobile.waitForFunction(()=>document.querySelector('[data-model-slot="boot-tv"]')?.dataset.glbState==='ready',null,{timeout:20000});
    const mobileState=await mobile.evaluate(()=>({
      kind:document.querySelector('[data-model-slot="boot-tv"]')?.dataset.modelKind,
      renderers:document.querySelectorAll('.v322-model-renderer').length,
      overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth,
    }));
    assert.equal(mobileState.kind,'procedural-crt');
    assert.equal(mobileState.renderers,1);
    assert.ok(mobileState.overflow<=2,'production mobile overflow regression');
    assert.equal(mobileErrors.length,0,'mobile page errors: '+mobileErrors.join(' | '));
    await mobile.screenshot({path:'_site/qa-v348-crt-procedural-mobile.png',fullPage:false});
    await mobile.close();

    console.log(JSON.stringify({qa:'v348-crt-procedural',status:'PASS',glbReplacement:state,production:productionState,mobile:mobileState}));
  } finally {
    await browser.close();
    try{fs.unlinkSync(fixture)}catch{}
  }
})().catch(err=>{console.error(err);process.exit(1)});
