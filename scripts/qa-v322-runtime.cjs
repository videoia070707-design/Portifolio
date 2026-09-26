const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');

(async()=>{
  const fixture='_site/qa-v322-model.gltf';
  const browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-webgl','--ignore-gpu-blocklist']});
  try{
    const page=await browser.newPage({viewport:{width:1440,height:1000},deviceScaleFactor:1});
    const errors=[];page.on('pageerror',e=>errors.push(String(e)));
    await page.goto('http://127.0.0.1:4173/?crtModel=qa-v322-model.gltf',{waitUntil:'domcontentloaded',timeout:30000});
    await page.waitForFunction(()=>document.documentElement.dataset.v322Glb==='ready',null,{timeout:10000});
    await page.waitForFunction(()=>document.querySelector('[data-model-slot="boot-tv"]')?.dataset.glbState==='ready',null,{timeout:20000});
    const state=await page.evaluate(()=>{
      const el=document.querySelector('[data-model-slot="boot-tv"]');
      const inst=window.MOVX3D?.runtime?.instances?.['boot-tv'];
      const fallback=el.querySelector('.crt-screen');
      return {
        production:document.documentElement.dataset.movxProduction,
        runtime:document.documentElement.dataset.glbRuntime,
        rootState:document.documentElement.dataset.v322Glb,
        requested:document.documentElement.dataset.v322Requested,
        slotState:el.dataset.glbState,
        canvas:!!el.querySelector('.v322-model-renderer canvas'),
        active:el.classList.contains('v322-runtime-active'),
        fallbackVisibility:fallback?getComputedStyle(fallback).visibility:null,
        triangles:inst?.stats?.triangles,
        meshes:inst?.stats?.meshes,
        errors:window.MOVX3D?.runtime?.errors||[],
        contextLimit:window.MOVX3D?.runtime?.contextLimit,
      };
    });
    assert.equal(state.production,'v321-production-storyboard');
    assert.equal(state.runtime,'v322-unified-glb-runtime');
    assert.equal(state.rootState,'ready');
    assert.equal(state.slotState,'ready');
    assert.ok(state.canvas&&state.active,'real model renderer did not mount');
    assert.equal(state.fallbackVisibility,'hidden','DOM fallback should hide only after the model mounts');
    assert.equal(state.triangles,1,'QA glTF triangle count mismatch');
    assert.equal(state.meshes,1,'QA glTF mesh count mismatch');
    assert.equal(state.errors.length,0,'runtime errors: '+JSON.stringify(state.errors));
    assert.ok([2,3].includes(state.contextLimit),'context limit not installed');
    assert.equal(errors.length,0,'page errors: '+errors.join(' | '));
    const loader=await page.request.get('http://127.0.0.1:4173/vendor/three-addons/loaders/GLTFLoader.js');
    assert.equal(loader.status(),200,'local GLTFLoader module missing');
    await page.screenshot({path:'_site/qa-v322-glb-desktop.png',fullPage:false});

    // Production now contains a v323 manifest. Validate that the runtime registers
    // exactly those six approved models instead of the old pre-pack dormant state.
    const manifestPage=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1});
    const manifestErrors=[];manifestPage.on('pageerror',e=>manifestErrors.push(String(e)));
    await manifestPage.goto('http://127.0.0.1:4173/',{waitUntil:'domcontentloaded',timeout:30000});
    await manifestPage.waitForFunction(()=>document.documentElement.dataset.v322Glb==='ready',null,{timeout:10000});
    const manifestState=await manifestPage.evaluate(()=>({
      requested:document.documentElement.dataset.v322Requested,
      renderers:document.querySelectorAll('.v322-model-renderer').length,
      instances:Object.keys(window.MOVX3D?.runtime?.instances||{}).sort(),
      contextLimit:window.MOVX3D?.runtime?.contextLimit,
      overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth,
      bootTvRegistered:!!window.MOVX3D?.runtime?.instances?.['boot-tv'],
      manifest:window.MOVX3D_MODELS||{},
    }));
    const expected=['creative-machine','hero-movx-logo','play-camera','play-cube','spatial-studio','x-portal'];
    assert.equal(manifestState.requested,'6','production manifest should register six Tripo models');
    assert.deepEqual(manifestState.instances,expected,'unexpected production model registry');
    assert.equal(Object.keys(manifestState.manifest).length,6,'production model manifest count mismatch');
    assert.equal(manifestState.bootTvRegistered,false,'boot-tv should remain on DOM fallback until its GLB exists');
    assert.ok(manifestState.renderers<=manifestState.contextLimit,'live WebGL renderers exceeded context limit');
    assert.ok(manifestState.overflow<=2,'production mobile overflow regression');
    assert.equal(manifestErrors.length,0,'production manifest page errors: '+manifestErrors.join(' | '));
    await manifestPage.close();

    console.log(JSON.stringify({qa:'v322-unified-glb-runtime',status:'PASS',loaded:state,productionManifest:manifestState}));
  } finally {
    await browser.close();
    try{fs.unlinkSync(fixture)}catch{}
  }
})().catch(err=>{console.error(err);process.exit(1)});
