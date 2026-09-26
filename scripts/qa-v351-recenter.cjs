const {chromium}=require('playwright');
const assert=require('node:assert/strict');

(async()=>{
  const browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-webgl','--ignore-gpu-blocklist']});
  try{
    for(const cfg of [
      {name:'desktop',viewport:{width:1440,height:1000}},
      {name:'mobile',viewport:{width:390,height:844}},
    ]){
      const page=await browser.newPage({viewport:cfg.viewport,deviceScaleFactor:1});
      const errors=[];page.on('pageerror',e=>errors.push(String(e)));
      await page.goto('http://127.0.0.1:4173/',{waitUntil:'domcontentloaded',timeout:30000});
      await page.waitForFunction(()=>document.documentElement.dataset.crtRecenter==='ready',null,{timeout:30000});
      const state=await page.evaluate(()=>{
        const el=document.querySelector('[data-model-slot="boot-tv"]');
        const host=el?.querySelector('.v322-model-renderer');
        const inst=window.MOVX3D?.runtime?.instances?.['boot-tv'];
        const r=el?.getBoundingClientRect();
        const hr=host?.getBoundingClientRect();
        return {
          fit:document.documentElement.dataset.crtFit,
          asset:document.documentElement.dataset.crtAsset,
          source:document.documentElement.dataset.crtSource,
          kind:el?.dataset.modelKind,
          version:inst?.stats?.version||null,
          meshes:inst?.stats?.meshes??null,
          sourceMeshes:inst?.stats?.sourceMeshes??null,
          removedParts:inst?.stats?.removedParts??null,
          crtParts:inst?.stats?.crtParts||[],
          recenter:inst?.stats?.recenter||null,
          runtimeFit:inst?.stats?.fit||null,
          slotRect:r?{x:r.x,y:r.y,width:r.width,height:r.height}:null,
          hostRect:hr?{x:hr.x,y:hr.y,width:hr.width,height:hr.height}:null,
          renderers:document.querySelectorAll('.v322-model-renderer').length,
          deferred:window.MOVX3D?.runtime?.deferredSlots||[],
          errors:window.MOVX3D?.runtime?.errors||[],
          overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth,
        };
      });
      assert.equal(state.fit,'v351-scaled-center');
      assert.equal(state.asset,'v352-standalone-vintage-computer');
      assert.equal(state.kind,'glb');
      assert.equal(state.version,'v352-standalone-crt');
      assert.equal(state.runtimeFit,'full-product');
      assert.ok(state.meshes>0,'standalone CRT has no meshes');
      assert.equal(state.meshes,state.sourceMeshes,'standalone CRT must preserve every source mesh');
      assert.equal(state.removedParts,0,'standalone CRT must not remove meshes');
      assert.equal(state.crtParts.length,0,'legacy prop-pack mesh extraction is still active');
      assert.ok(state.recenter,'CRT recenter stats missing');
      assert.equal(state.recenter.revision,'v351-scaled-center');
      assert.ok(Math.abs(state.recenter.after.x)<0.002,'CRT remains horizontally off-center: '+state.recenter.after.x);
      assert.ok(Math.abs(state.recenter.after.y)<0.002,'CRT remains vertically off-center: '+state.recenter.after.y);
      assert.ok(Math.abs(state.recenter.after.z)<0.002,'CRT remains depth-offset: '+state.recenter.after.z);
      assert.equal(state.renderers,1,'more than one 3D renderer active');
      assert.ok(state.deferred.includes('hero-movx-logo')&&state.deferred.includes('x-portal'),'later models must remain deferred');
      assert.equal(state.errors.length,0,'runtime errors: '+JSON.stringify(state.errors));
      assert.ok(state.overflow<=2,'horizontal overflow regression');
      assert.equal(errors.length,0,'page errors: '+errors.join(' | '));
      await page.waitForTimeout(250);
      await page.screenshot({path:`_site/qa-v351-real-crt-centered-${cfg.name}.png`,fullPage:false});
      console.log(JSON.stringify({qa:'v352-standalone-crt',viewport:cfg.name,status:'PASS',state}));
      await page.close();
    }
  }finally{await browser.close()}
})().catch(err=>{console.error(err);process.exit(1)});
