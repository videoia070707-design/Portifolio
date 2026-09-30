const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');

(async()=>{
  const models=fs.readdirSync('_site/models').filter(x=>x.toLowerCase().endsWith('.glb')).sort();
  assert.deepEqual(models,['movx-crt-tv.glb'],'v373 must keep exactly one production GLB');

  const browser=await chromium.launch({headless:true,args:['--no-sandbox','--use-angle=swiftshader','--enable-webgl','--ignore-gpu-blocklist']});
  try{
    const page=await browser.newPage({viewport:{width:1440,height:1000},deviceScaleFactor:1});
    const errors=[];page.on('pageerror',e=>errors.push(String(e)));
    await page.route('**/models/movx-crt-tv.glb',async route=>{
      const response=await route.fetch();
      await new Promise(resolve=>setTimeout(resolve,2600));
      await route.fulfill({response});
    });
    await page.goto('http://127.0.0.1:4173/',{waitUntil:'domcontentloaded',timeout:30000});
    await page.waitForFunction(()=>document.documentElement.dataset.crtInstantPresenceLayer==='v373-poster-continuity',null,{timeout:5000});
    await page.waitForFunction(()=>document.documentElement.dataset.crtInteractionReady==='true',null,{timeout:8000});
    await page.waitForFunction(()=>{
      const slot=document.querySelector('[data-model-slot="boot-tv"]');
      const poster=slot?.querySelector('.crt-loading-poster');
      if(!slot||!poster)return false;
      const s=getComputedStyle(poster);
      return slot.dataset.glbState!=='ready'&&s.display!=='none'&&Number(s.opacity)>.95;
    },null,{timeout:6000});

    const before=await page.evaluate(()=>{
      const root=document.documentElement,boot=document.querySelector('#boot');
      const slot=boot.querySelector('[data-model-slot="boot-tv"]');
      const poster=slot.querySelector('.crt-loading-poster');const s=getComputedStyle(poster);
      return {layer:root.dataset.crtInstantPresenceLayer,state:slot.dataset.glbState,mode:boot.dataset.crtMode,transform:s.transform,opacity:s.opacity,display:s.display,transition:s.transitionDuration,renderers:document.querySelectorAll('.v322-model-renderer').length,overflow:root.scrollWidth-innerWidth};
    });
    assert.equal(before.layer,'v373-poster-continuity');
    assert.notEqual(before.state,'ready');assert.equal(before.display,'block');assert.ok(Number(before.opacity)>.95);assert.ok(before.overflow<=2);

    const scene=page.locator('#boot .scene-inner');const box=await scene.boundingBox();assert.ok(box&&box.width>500&&box.height>400);
    await page.mouse.move(box.x+box.width*.78,box.y+box.height*.39,{steps:10});
    await page.waitForFunction(previous=>{
      const poster=document.querySelector('[data-model-slot="boot-tv"] .crt-loading-poster');
      return poster&&getComputedStyle(poster).transform!==previous;
    },before.transform,{timeout:2500,polling:'raf'});
    const pointer=await page.evaluate(()=>{
      const root=document.documentElement,poster=document.querySelector('[data-model-slot="boot-tv"] .crt-loading-poster');
      return {px:parseFloat(getComputedStyle(root).getPropertyValue('--crt-px'))||0,py:parseFloat(getComputedStyle(root).getPropertyValue('--crt-py'))||0,transform:getComputedStyle(poster).transform};
    });
    assert.ok(Math.abs(pointer.px)>.2,'loading poster did not receive existing Scene-01 pointer intent');
    assert.notEqual(pointer.transform,before.transform,'loading poster stayed visually dead under pointer input');

    await page.locator('[data-crt-mode-control="motion"]').click();
    await page.waitForFunction(()=>document.querySelector('#boot')?.dataset.crtMode==='motion',null,{timeout:3000});
    await page.waitForTimeout(280);
    const motion=await page.evaluate(()=>{
      const boot=document.querySelector('#boot'),slot=boot.querySelector('[data-model-slot="boot-tv"]'),poster=slot.querySelector('.crt-loading-poster');
      const s=getComputedStyle(poster);
      return {mode:boot.dataset.crtMode,state:slot.dataset.glbState,transform:s.transform,opacity:s.opacity,display:s.display};
    });
    assert.equal(motion.mode,'motion');assert.notEqual(motion.state,'ready');assert.equal(motion.display,'block');assert.ok(Number(motion.opacity)>.95);
    assert.notEqual(motion.transform,pointer.transform,'channel selection produced no immediate poster response before GLB ready');
    await page.locator('#boot').screenshot({path:'_site/qa-v373-loading-presence.png'});

    await page.waitForFunction(()=>document.querySelector('[data-model-slot="boot-tv"]')?.dataset.glbState==='ready',null,{timeout:25000});
    await page.waitForTimeout(650);
    const ready=await page.evaluate(()=>{
      const root=document.documentElement,boot=document.querySelector('#boot'),slot=boot.querySelector('[data-model-slot="boot-tv"]');
      const poster=slot.querySelector('.crt-loading-poster'),renderer=slot.querySelector('.v322-model-renderer');
      const ps=getComputedStyle(poster),rs=getComputedStyle(renderer);
      const inst=window.MOVX3D.runtime.instances['boot-tv'];
      return {state:slot.dataset.glbState,posterDisplay:ps.display,posterOpacity:ps.opacity,posterVisibility:ps.visibility,rendererOpacity:rs.opacity,renderers:document.querySelectorAll('.v322-model-renderer').length,activeSlots:window.MOVX3D.runtime.activeSlots,triangles:inst.stats.triangles,errors:window.MOVX3D.runtime.errors,overflow:root.scrollWidth-innerWidth};
    });
    assert.equal(ready.state,'ready');
    assert.equal(ready.posterDisplay,'block','poster must remain renderable for optical fade instead of display:none cut');
    assert.ok(Number(ready.posterOpacity)<.02,'poster did not fade away after real GLB handoff');
    assert.ok(Number(ready.rendererOpacity)>.98,'real renderer did not become fully visible');
    assert.equal(ready.renderers,1);assert.deepEqual(ready.activeSlots,['boot-tv']);assert.equal(ready.triangles,44831);assert.equal(ready.errors.length,0);assert.ok(ready.overflow<=2);
    await page.locator('#boot').screenshot({path:'_site/qa-v373-ready-handoff.png'});
    assert.equal(errors.length,0,'desktop page errors: '+errors.join(' | '));
    console.log(JSON.stringify({qa:'v373-crt-instant-presence',viewport:'desktop',status:'PASS',before,pointer,motion,ready}));
    await page.close();

    const reduced=await browser.newPage({viewport:{width:1280,height:800},reducedMotion:'reduce'});
    await reduced.route('**/models/movx-crt-tv.glb',async route=>{const response=await route.fetch();await new Promise(r=>setTimeout(r,1100));await route.fulfill({response});});
    await reduced.goto('http://127.0.0.1:4173/',{waitUntil:'domcontentloaded',timeout:30000});
    await reduced.waitForFunction(()=>document.documentElement.dataset.crtInstantPresenceLayer==='v373-poster-continuity',null,{timeout:5000});
    await reduced.waitForFunction(()=>{
      const slot=document.querySelector('[data-model-slot="boot-tv"]'),poster=slot?.querySelector('.crt-loading-poster');
      return slot&&poster&&slot.dataset.glbState!=='ready'&&getComputedStyle(poster).display==='block';
    },null,{timeout:5000});
    const reducedLoading=await reduced.evaluate(()=>{const poster=document.querySelector('[data-model-slot="boot-tv"] .crt-loading-poster'),s=getComputedStyle(poster);return {transform:s.transform,transition:s.transitionDuration,opacity:s.opacity}});
    assert.equal(reducedLoading.transform,'none');
    assert.ok(reducedLoading.transition.split(',').every(v=>v.trim()==='0s'),'reduced-motion loading poster must not animate');
    await reduced.waitForFunction(()=>document.querySelector('[data-model-slot="boot-tv"]')?.dataset.glbState==='ready',null,{timeout:25000});
    const reducedReady=await reduced.evaluate(()=>{const root=document.documentElement,slot=document.querySelector('[data-model-slot="boot-tv"]'),poster=slot.querySelector('.crt-loading-poster');return {opacity:getComputedStyle(poster).opacity,renderers:document.querySelectorAll('.v322-model-renderer').length,activeSlots:window.MOVX3D.runtime.activeSlots,overflow:root.scrollWidth-innerWidth}});
    assert.ok(Number(reducedReady.opacity)<.02);assert.equal(reducedReady.renderers,1);assert.deepEqual(reducedReady.activeSlots,['boot-tv']);assert.ok(reducedReady.overflow<=2);
    console.log(JSON.stringify({qa:'v373-crt-instant-presence',viewport:'reduced',status:'PASS',reducedLoading,reducedReady}));
    await reduced.close();
  } finally {await browser.close()}
})().catch(err=>{console.error(err);process.exit(1)});
