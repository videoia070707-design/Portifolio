const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');

(async()=>{
  const fixture='_site/qa-v322-model.gltf';
  const browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-webgl','--ignore-gpu-blocklist']});
  try{
    const page=await browser.newPage({viewport:{width:1440,height:1000},deviceScaleFactor:1});
    const errors=[];page.on('pageerror',e=>errors.push(String(e)));
    await page.goto('http://127.0.0.1:4173/?logoModel=qa-v322-model.gltf',{waitUntil:'domcontentloaded',timeout:30000});
    await page.waitForFunction(()=>document.documentElement.dataset.v322Glb==='ready',null,{timeout:10000});
    await page.waitForFunction(()=>document.querySelector('[data-model-slot="hero-movx-logo"]')?.dataset.glbState==='ready',null,{timeout:20000});
    const state=await page.evaluate(()=>{
      const el=document.querySelector('[data-model-slot="hero-movx-logo"]');
      const inst=window.MOVX3D?.runtime?.instances?.['hero-movx-logo'];
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
    assert.equal(state.scope,'hero-movx-logo');
    assert.equal(state.requested,'1');
    assert.equal(state.slotState,'ready');
    assert.ok(state.canvas&&state.active,'Physical Logo renderer did not mount');
    assert.equal(state.triangles,1,'QA glTF triangle count mismatch');
    assert.equal(state.meshes,1,'QA glTF mesh count mismatch');
    assert.equal(state.errors.length,0,'runtime errors: '+JSON.stringify(state.errors));
    assert.deepEqual(state.activeSlots,['hero-movx-logo']);
    assert.equal(state.singleModelMode,true,'single-model runtime gate missing');
    assert.ok([2,3].includes(state.contextLimit),'context limit not installed');
    assert.equal(errors.length,0,'page errors: '+errors.join(' | '));
    const loader=await page.request.get('http://127.0.0.1:4173/vendor/three-addons/loaders/GLTFLoader.js');
    assert.equal(loader.status(),200,'local GLTFLoader module missing');
    await page.screenshot({path:'_site/qa-v322-glb-desktop.png',fullPage:false});

    // Production must register exactly the first approved model. Future slots may
    // exist in the storyboard, but stay deferred on their DOM/CSS fallbacks.
    const manifestPage=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1});
    const manifestErrors=[];manifestPage.on('pageerror',e=>manifestErrors.push(String(e)));
    await manifestPage.goto('http://127.0.0.1:4173/',{waitUntil:'domcontentloaded',timeout:30000});
    await manifestPage.waitForFunction(()=>document.documentElement.dataset.v322Glb==='ready',null,{timeout:10000});
    const manifestState=await manifestPage.evaluate(()=>({
      requested:document.documentElement.dataset.v322Requested,
      scope:document.documentElement.dataset.modelScope,
      renderers:document.querySelectorAll('.v322-model-renderer').length,
      instances:Object.keys(window.MOVX3D?.runtime?.instances||{}).sort(),
      deferred:window.MOVX3D?.runtime?.deferredSlots||[],
      contextLimit:window.MOVX3D?.runtime?.contextLimit,
      overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth,
      manifest:window.MOVX3D_MODELS||{},
    }));
    const expected=['hero-movx-logo'];
    assert.equal(manifestState.requested,'1','production must register exactly one 3D model');
    assert.equal(manifestState.scope,'v347-physical-logo-only','production model scope marker mismatch');
    assert.deepEqual(manifestState.instances,expected,'unexpected production model registry');
    assert.equal(Object.keys(manifestState.manifest).length,1,'production model manifest must contain one model');
    assert.equal(manifestState.manifest['hero-movx-logo'],'models/movx-physical-logo.glb','wrong first model asset');
    assert.ok(manifestState.deferred.includes('x-portal'),'x-portal should remain deferred');
    assert.ok(manifestState.deferred.includes('creative-machine'),'creative-machine should remain deferred');
    assert.ok(manifestState.renderers<=1,'more than one WebGL renderer mounted in single-model mode');
    assert.ok(manifestState.overflow<=2,'production mobile overflow regression');
    assert.equal(manifestErrors.length,0,'production manifest page errors: '+manifestErrors.join(' | '));
    await manifestPage.close();

    console.log(JSON.stringify({qa:'v347-single-model-runtime',status:'PASS',loaded:state,productionManifest:manifestState}));
  } finally {
    await browser.close();
    try{fs.unlinkSync(fixture)}catch{}
  }
})().catch(err=>{console.error(err);process.exit(1)});
