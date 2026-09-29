const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');

(async()=>{
  const glb='_site/models/movx-crt-tv.glb';
  assert.ok(fs.existsSync(glb),'optimized CRT GLB missing');
  const glbBytes=fs.statSync(glb).size;
  assert.ok(glbBytes<1600000,`optimized CRT exceeded the 1.6 MB Scene-01 budget: ${glbBytes}`);

  const browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-webgl','--ignore-gpu-blocklist']});
  try{
    for(const cfg of [
      {name:'desktop',viewport:{width:1440,height:1000},target:9000,hardLimit:20000},
      {name:'mobile',viewport:{width:390,height:844},target:11000,hardLimit:20000},
    ]){
      const page=await browser.newPage({viewport:cfg.viewport,deviceScaleFactor:1});
      const errors=[];page.on('pageerror',e=>errors.push(String(e)));
      const started=Date.now();
      await page.goto('http://127.0.0.1:4173/',{waitUntil:'domcontentloaded',timeout:30000});
      const boot=page.locator('[data-model-slot="boot-tv"]');
      const initial=await boot.evaluate(el=>{
        const legacy=[...el.querySelectorAll(':scope > .crt-screen,:scope > .power,:scope > .crt-sticker,:scope > .v314-crt-details,:scope > .v314-model-status')]
          .map(x=>{const s=getComputedStyle(x);return {className:x.className,display:s.display,visibility:s.visibility,opacity:s.opacity}});
        const shell=getComputedStyle(el);
        const poster=el.querySelector(':scope > .crt-loading-poster');
        const posterStyle=poster?getComputedStyle(poster):null;
        return {
          state:el.dataset.glbState||'',
          fastload:document.documentElement.dataset.crtFastload||'',
          priority:document.documentElement.dataset.crtPriority||'',
          moduleWarmup:[...document.querySelectorAll('link[rel="modulepreload"][data-v356-module]')].map(x=>({module:x.dataset.v356Module,href:x.getAttribute('href'),priority:x.getAttribute('fetchpriority')})),
          legacy,
          legacyVisible:legacy.some(x=>x.display!=='none'&&x.visibility!=='hidden'&&parseFloat(x.opacity||'1')>0),
          posterVisible:!!posterStyle&&posterStyle.display!=='none'&&posterStyle.visibility!=='hidden'&&parseFloat(posterStyle.opacity||'1')>.9,
          posterSrc:poster?.getAttribute('src')||'',
          shellBoxShadow:shell.boxShadow,
          shellBorderRadius:shell.borderRadius,
          shellTransform:shell.transform,
        };
      });
      assert.equal(initial.priority,'v356-module-warmup','v356 CRT priority marker missing');
      assert.deepEqual(initial.moduleWarmup.map(x=>x.module).sort(),['gltfloader','three'],'Three.js/GLTFLoader module warmup links missing');
      assert.ok(initial.moduleWarmup.every(x=>x.priority==='high'),'module warmup is not high priority');
      // The real-TV poster is the visual contract. A slow software runner may
      // decode WebGL late, but the user must never see the obsolete CSS/proxy TV.
      if(initial.state!=='ready'){
        assert.equal(initial.fastload,'v355-optimized-preload','fast-load marker missing during initial load');
        assert.equal(initial.legacyVisible,false,'legacy CSS/DOM TV parts are visible during GLB load: '+JSON.stringify(initial.legacy));
        assert.equal(initial.posterVisible,true,'authored real-TV poster is not visible while GLB is loading');
        assert.ok(/crt-v358-poster\.webp$/.test(initial.posterSrc),'unexpected CRT loading poster: '+initial.posterSrc);
        assert.equal(initial.shellBoxShadow,'none','legacy CSS CRT chassis shadow is still visible during GLB load');
        assert.equal(initial.shellBorderRadius,'0px','legacy CSS CRT rounded chassis is still visible during GLB load');
        assert.equal(initial.shellTransform,'none','legacy CSS CRT perspective transform is still active during GLB load');
      }
      await page.waitForFunction(()=>document.querySelector('[data-model-slot="boot-tv"]')?.dataset.glbState==='ready',null,{timeout:cfg.hardLimit});
      const readyMs=Date.now()-started;
      const state=await page.evaluate(()=>({
        fastload:document.documentElement.dataset.crtFastload,
        priority:document.documentElement.dataset.crtPriority,
        kind:document.querySelector('[data-model-slot="boot-tv"]')?.dataset.modelKind,
        renderers:document.querySelectorAll('.v322-model-renderer').length,
        preload:!!document.querySelector('link[rel="preload"][href="models/movx-crt-tv.glb"][as="fetch"]'),
        moduleWarmup:[...document.querySelectorAll('link[rel="modulepreload"][data-v356-module]')].map(x=>x.dataset.v356Module).sort(),
        laterDeferred:(window.MOVX3D?.runtime?.deferredSlots||[]).includes('hero-movx-logo')&&(window.MOVX3D?.runtime?.deferredSlots||[]).includes('x-portal'),
        errors:window.MOVX3D?.runtime?.errors||[],
        overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth,
      }));
      assert.equal(state.fastload,'v355-optimized-preload');
      assert.equal(state.priority,'v356-module-warmup');
      assert.equal(state.kind,'glb');
      assert.equal(state.renderers,1);
      assert.equal(state.preload,true,'CRT preload link missing');
      assert.deepEqual(state.moduleWarmup,['gltfloader','three']);
      assert.equal(state.laterDeferred,true,'later 3D models escaped deferred gate');
      assert.equal(state.errors.length,0,'runtime errors: '+JSON.stringify(state.errors));
      assert.ok(state.overflow<=2,'horizontal overflow regression');
      assert.ok(readyMs<cfg.hardLimit,`CRT ready time ${readyMs}ms exceeded hard CI limit ${cfg.hardLimit}ms`);
      assert.equal(errors.length,0,'page errors: '+errors.join(' | '));
      const performanceStatus=readyMs<cfg.target?'target':'runner-slow-authored-fallback';
      await page.screenshot({path:`_site/qa-v355-fastload-${cfg.name}.png`,fullPage:false});
      console.log(JSON.stringify({qa:'v356-crt-first-frame',viewport:cfg.name,status:'PASS',performanceStatus,targetMs:cfg.target,readyMs,initial,glbBytes,state}));
      await page.close();
    }
  } finally {await browser.close()}
})().catch(err=>{console.error(err);process.exit(1)});
