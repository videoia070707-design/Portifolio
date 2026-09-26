const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');

(async()=>{
  const fixture='_site/qa-v322-model.gltf';
  const browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-webgl','--ignore-gpu-blocklist']});
  try{
    // Prove that the first storyboard slot can load a real GLTF through the
    // production runtime, without enabling any later model.
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
    assert.ok(state.canvas&&state.active,'CRT fixture renderer did not mount');
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

    // Until the user supplies the approved CRT GLB, production must load ZERO
    // later GLBs. The CRT slot waits for its model; every later slot is deferred.
    const prod=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1});
    const prodErrors=[];prod.on('pageerror',e=>prodErrors.push(String(e)));
    await prod.goto('http://127.0.0.1:4173/',{waitUntil:'domcontentloaded',timeout:30000});
    await prod.waitForFunction(()=>document.documentElement.dataset.v322Glb==='ready',null,{timeout:10000});
    const productionState=await prod.evaluate(()=>({
      requested:document.documentElement.dataset.v322Requested,
      scope:document.documentElement.dataset.modelScope,
      runtimeScope:document.documentElement.dataset.movx3dScope,
      renderers:document.querySelectorAll('.v322-model-renderer').length,
      instances:Object.keys(window.MOVX3D?.runtime?.instances||{}).sort(),
      awaiting:window.MOVX3D?.runtime?.awaitingSlots||[],
      deferred:window.MOVX3D?.runtime?.deferredSlots||[],
      overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth,
      manifest:window.MOVX3D_MODELS||{},
      bootState:document.querySelector('[data-model-slot="boot-tv"]')?.dataset.glbState||null,
    }));
    assert.equal(productionState.requested,'0','no GLB should load before the approved CRT file exists');
    assert.equal(productionState.scope,'v347-crt-only','production model scope marker mismatch');
    assert.equal(productionState.runtimeScope,'boot-tv','runtime scope must be the first storyboard slot');
    assert.deepEqual(productionState.instances,[],'unexpected production model registry');
    assert.equal(Object.keys(productionState.manifest).length,0,'later models leaked into production manifest');
    assert.ok(productionState.awaiting.includes('boot-tv'),'CRT slot should be awaiting its GLB');
    assert.equal(productionState.bootState,'awaiting-model','CRT slot state mismatch');
    assert.ok(productionState.deferred.includes('hero-movx-logo'),'Physical Logo must remain deferred');
    assert.ok(productionState.deferred.includes('x-portal'),'X Portal must remain deferred');
    assert.equal(productionState.renderers,0,'production rendered a later GLB before CRT approval');
    assert.ok(productionState.overflow<=2,'production mobile overflow regression');
    assert.equal(prodErrors.length,0,'production page errors: '+prodErrors.join(' | '));
    await prod.close();

    console.log(JSON.stringify({qa:'v347-crt-first-gate',status:'PASS',fixture:state,production:productionState}));
  } finally {
    await browser.close();
    try{fs.unlinkSync(fixture)}catch{}
  }
})().catch(err=>{console.error(err);process.exit(1)});
