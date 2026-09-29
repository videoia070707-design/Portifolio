const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');

(async()=>{
  const browser=await chromium.launch({args:['--no-sandbox','--use-angle=swiftshader','--enable-webgl','--ignore-gpu-blocklist']});
  const base=process.env.MOVX_TEST_URL||'http://127.0.0.1:4173/';
  const results=[];

  // Desktop cold-load contract: poster of the approved TV must cover the load;
  // the old procedural/CSS television must never become the normal preview.
  {
    const page=await browser.newPage({viewport:{width:1366,height:768}}),errors=[];
    page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
    await page.route('**/models/movx-crt-tv.glb',async route=>{await new Promise(r=>setTimeout(r,900));await route.continue()});
    await page.goto(base,{waitUntil:'domcontentloaded'});
    await page.waitForSelector('[data-model-slot="boot-tv"]');
    await page.waitForTimeout(180);
    const loading=await page.evaluate(()=>{
      const slot=document.querySelector('[data-model-slot="boot-tv"]');
      const poster=slot?.querySelector('.crt-loading-poster');
      const oldScreen=slot?.querySelector('.crt-screen');
      return {
        marker:document.documentElement.dataset.crtPresenceLayer||null,
        loadingMode:document.documentElement.dataset.crtLoading||null,
        state:slot?.dataset.glbState||null,
        posterDisplay:poster?getComputedStyle(poster).display:null,
        posterOpacity:poster?parseFloat(getComputedStyle(poster).opacity):0,
        oldScreenDisplay:oldScreen?getComputedStyle(oldScreen).display:null,
        preview:!!window.MOVX3D?.runtime?.instances?.['boot-tv']?.previewProcedural,
        source:document.documentElement.dataset.crtSource||null
      };
    });
    assert.equal(loading.marker,'v366-clean-boot-presence');
    assert.equal(loading.loadingMode,'poster-only');
    assert.equal(loading.posterDisplay,'block');assert.ok(loading.posterOpacity>.9);
    if(loading.oldScreenDisplay!==null)assert.equal(loading.oldScreenDisplay,'none');
    assert.equal(loading.preview,false);assert.notEqual(loading.state,'preview-ready');

    await page.waitForFunction(()=>{const i=window.MOVX3D?.runtime?.instances?.['boot-tv'];return i?.loaded&&i?.presence?.state&&document.documentElement.dataset.crtPresence==='v366-ready'},null,{timeout:30000});
    const before=await page.evaluate(()=>{const i=window.MOVX3D.runtime.instances['boot-tv'];return {x:i.camera.position.x,y:i.camera.position.y,ry:i.group.rotation.y,hover:i.presence.state.hoverMix,triangles:i.stats.triangles,canvases:document.querySelectorAll('.v322-model-renderer canvas').length,preview:!!i.previewProcedural}});
    const box=await page.locator('#boot .v322-model-renderer canvas').boundingBox();assert.ok(box);
    await page.mouse.move(box.x+box.width*.38,box.y+box.height*.46,{steps:8});await page.waitForTimeout(420);
    const after=await page.evaluate(()=>{const i=window.MOVX3D.runtime.instances['boot-tv'];return {x:i.camera.position.x,y:i.camera.position.y,ry:i.group.rotation.y,hover:i.presence.state.hoverMix,frames:i.presence.state.frames,presence:document.querySelector('#boot').dataset.crtPresence}});
    assert.equal(before.triangles,44831);assert.equal(before.canvases,1);assert.equal(before.preview,false);
    assert.ok(after.frames>0);assert.ok(after.hover>.2,'desktop hover must visibly engage the real CRT');
    assert.ok(Math.abs(after.x-before.x)>.002||Math.abs(after.ry-before.ry)>.004,'real CRT/camera must respond spatially to pointer');

    const grid=await page.evaluate(()=>{
      const wrap=document.querySelector('#boot .crt-wrap').getBoundingClientRect();
      const copy=document.querySelector('#boot .boot-copy').getBoundingClientRect();
      const title=document.querySelector('#boot .boot-title').getBoundingClientRect();
      const p=document.querySelector('#boot .boot-copy .copy').getBoundingClientRect();
      const tags=document.querySelector('#boot .boot-tags').getBoundingClientRect();
      return {columnGap:copy.left-wrap.right,titleCopyGap:p.top-title.bottom,copyTagsGap:tags.top-p.bottom};
    });
    assert.ok(grid.columnGap>28,`Scene-01 columns too tight: ${JSON.stringify(grid)}`);
    assert.ok(grid.titleCopyGap>20,`headline/copy spacing too tight: ${JSON.stringify(grid)}`);
    assert.ok(grid.copyTagsGap>18,`copy/channel spacing too tight: ${JSON.stringify(grid)}`);
    assert.deepEqual(errors,[]);
    await page.locator('#boot').screenshot({path:'_site/qa-v366-desktop-clean-presence.png'});
    results.push({name:'desktop',status:'PASS',loading,grid,after});await page.close();
  }

  for(const cfg of [
    {name:'mobile',viewport:{width:390,height:844},isMobile:true,hasTouch:true},
    {name:'reduced',viewport:{width:1280,height:800},reducedMotion:'reduce'}
  ]){
    const page=await browser.newPage(cfg),errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
    await page.goto(base,{waitUntil:'domcontentloaded'});
    await page.waitForFunction(()=>window.MOVX3D?.runtime?.instances?.['boot-tv']?.presence?.state,null,{timeout:30000});
    const state=await page.evaluate(()=>{const i=window.MOVX3D.runtime.instances['boot-tv'];return {triangles:i.stats.triangles,preview:!!i.previewProcedural,coarse:i.presence.state.coarse,reduced:i.presence.state.reduced,hover:i.presence.state.hoverMix,canvases:document.querySelectorAll('.v322-model-renderer canvas').length,marker:document.documentElement.dataset.crtPresence}});
    assert.equal(state.triangles,44831);assert.equal(state.preview,false);assert.equal(state.canvases,1);assert.equal(state.marker,'v366-ready');
    if(cfg.name==='mobile')assert.equal(state.coarse,true);
    if(cfg.name==='reduced'){
      assert.equal(state.reduced,true);
      const box=await page.locator('#boot .v322-model-renderer canvas').boundingBox();if(box){await page.mouse.move(box.x+box.width*.4,box.y+box.height*.4);await page.waitForTimeout(220)}
      const reducedAfter=await page.evaluate(()=>window.MOVX3D.runtime.instances['boot-tv'].presence.state.hoverMix);
      assert.equal(reducedAfter,0,'reduced motion must not add autonomous hover movement');
    }
    assert.deepEqual(errors,[]);results.push({name:cfg.name,status:'PASS',state});await page.close();
  }
  await browser.close();fs.writeFileSync('_site/qa-v366-results.json',JSON.stringify(results,null,2));console.log(JSON.stringify(results));
})().catch(e=>{console.error(e);process.exit(1)});
