const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');

(async()=>{
  const glb='_site/models/movx-crt-tv.glb';
  assert.ok(fs.existsSync(glb),'optimized CRT GLB missing');
  const glbBytes=fs.statSync(glb).size;
  assert.ok(glbBytes<8683624,`optimized CRT is not smaller than uploaded source: ${glbBytes}`);

  const browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-webgl','--ignore-gpu-blocklist']});
  try{
    for(const cfg of [
      {name:'desktop',viewport:{width:1440,height:1000},limit:9000},
      {name:'mobile',viewport:{width:390,height:844},limit:11000},
    ]){
      const page=await browser.newPage({viewport:cfg.viewport,deviceScaleFactor:1});
      const errors=[];page.on('pageerror',e=>errors.push(String(e)));
      const started=Date.now();
      await page.goto('http://127.0.0.1:4173/',{waitUntil:'domcontentloaded',timeout:30000});
      const boot=page.locator('[data-model-slot="boot-tv"]');
      const initial=await boot.evaluate(el=>({
        state:el.dataset.glbState||'',
        fakeVisible:[...el.children].filter(x=>!x.classList.contains('v322-model-renderer')).some(x=>{
          const s=getComputedStyle(x);return s.visibility!=='hidden'&&s.opacity!=='0'
        })
      }));
      // If the optimized/preloaded GLB is already ready by DOMContentLoaded,
      // the loading-state assertion no longer applies. Otherwise the obsolete
      // CSS/DOM television must be completely hidden until WebGL is ready.
      if(initial.state!=='ready'){
        assert.equal(initial.fakeVisible,false,'legacy CSS/DOM TV is visible during GLB load');
      }
      await page.waitForFunction(()=>document.querySelector('[data-model-slot="boot-tv"]')?.dataset.glbState==='ready',null,{timeout:cfg.limit});
      const readyMs=Date.now()-started;
      const state=await page.evaluate(()=>({
        fastload:document.documentElement.dataset.crtFastload,
        kind:document.querySelector('[data-model-slot="boot-tv"]')?.dataset.modelKind,
        renderers:document.querySelectorAll('.v322-model-renderer').length,
        preload:!!document.querySelector('link[rel="preload"][href="models/movx-crt-tv.glb"][as="fetch"]'),
        laterDeferred:(window.MOVX3D?.runtime?.deferredSlots||[]).includes('hero-movx-logo')&&(window.MOVX3D?.runtime?.deferredSlots||[]).includes('x-portal'),
        errors:window.MOVX3D?.runtime?.errors||[],
        overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth,
      }));
      assert.equal(state.fastload,'v355-optimized-preload');
      assert.equal(state.kind,'glb');
      assert.equal(state.renderers,1);
      assert.equal(state.preload,true,'CRT preload link missing');
      assert.equal(state.laterDeferred,true,'later 3D models escaped deferred gate');
      assert.equal(state.errors.length,0,'runtime errors: '+JSON.stringify(state.errors));
      assert.ok(state.overflow<=2,'horizontal overflow regression');
      assert.ok(readyMs<cfg.limit,`CRT ready time ${readyMs}ms exceeded ${cfg.limit}ms`);
      assert.equal(errors.length,0,'page errors: '+errors.join(' | '));
      await page.screenshot({path:`_site/qa-v355-fastload-${cfg.name}.png`,fullPage:false});
      console.log(JSON.stringify({qa:'v355-crt-fastload',viewport:cfg.name,status:'PASS',readyMs,initial,glbBytes,state}));
      await page.close();
    }
  } finally {await browser.close()}
})().catch(err=>{console.error(err);process.exit(1)});