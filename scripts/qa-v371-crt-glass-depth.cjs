const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');

(async()=>{
  const models=fs.readdirSync('_site/models').filter(x=>x.toLowerCase().endsWith('.glb')).sort();
  assert.deepEqual(models,['movx-crt-tv.glb'],'v371 must keep exactly one production GLB');
  const browser=await chromium.launch({headless:true,args:['--no-sandbox','--use-angle=swiftshader','--enable-webgl','--ignore-gpu-blocklist']});
  try{
    const page=await browser.newPage({viewport:{width:1440,height:1000},deviceScaleFactor:1});
    const errors=[];const shaderErrors=[];
    page.on('pageerror',e=>errors.push(String(e)));
    page.on('console',msg=>{if(msg.type()==='error'&&/(shader error|webglprogram|gl_invalid_operation)/i.test(msg.text()))shaderErrors.push(msg.text())});
    await page.goto('http://127.0.0.1:4173/',{waitUntil:'domcontentloaded',timeout:30000});
    await page.waitForFunction(()=>document.querySelector('[data-model-slot="boot-tv"]')?.dataset.glbState==='ready',null,{timeout:25000});
    await page.waitForFunction(()=>window.MOVX3D?.runtime?.instances?.['boot-tv']?.crtGlassDepth?.state?.compiled===true,null,{timeout:15000});

    const initial=await page.evaluate(()=>{
      const root=document.documentElement,boot=document.querySelector('#boot');
      const r=window.MOVX3D.runtime,inst=r.instances['boot-tv'],glass=inst.crtGlassDepth;
      return {
        layer:root.dataset.crtGlassDepthLayer,
        ready:root.dataset.crtGlass,
        shader:boot.dataset.crtGlassShader,
        channel:glass.state.channel,
        tint:glass.state.tint,
        compileCount:glass.state.compileCount,
        frames:glass.state.frames,
        materialKey:glass.material.customProgramCacheKey(),
        roughness:glass.material.roughness,
        screenName:glass.screen.name,
        renderers:document.querySelectorAll('.v322-model-renderer').length,
        rendererCanvases:document.querySelectorAll('.v322-model-renderer canvas').length,
        activeSlots:r.activeSlots,
        triangles:inst.stats.triangles,
        overflow:root.scrollWidth-innerWidth,
        runtimeErrors:r.errors,
      };
    });
    assert.equal(initial.layer,'v371-curved-screen-glass');
    assert.equal(initial.ready,'v371-ready');
    assert.equal(initial.shader,'compiled');
    assert.equal(initial.channel,'direction');
    assert.equal(initial.screenName,'tripo_part_1');
    assert.ok(initial.compileCount>=1,'v371 screen shader never compiled');
    assert.ok(initial.materialKey.includes('movx-live-screen-v361')&&initial.materialKey.includes('movx-crt-glass-v371'),'v371 must wrap, not replace, the v361 screen programme');
    assert.ok(initial.roughness<=.381,'screen roughness did not move into glass response range');
    assert.equal(initial.renderers,1);assert.equal(initial.rendererCanvases,1);assert.deepEqual(initial.activeSlots,['boot-tv']);assert.equal(initial.triangles,44831);assert.ok(initial.overflow<=2);assert.equal(initial.runtimeErrors.length,0);

    const scene=page.locator('#boot .scene-inner');const box=await scene.boundingBox();assert.ok(box&&box.width>500&&box.height>400);
    await page.mouse.move(box.x+box.width*.82,box.y+box.height*.33,{steps:12});
    await page.waitForFunction(()=>{
      const s=window.MOVX3D.runtime.instances['boot-tv'].crtGlassDepth.state;
      return s.presence>.22&&Math.abs(s.pointerX)>.18&&s.frames>8;
    },null,{timeout:7000,polling:'raf'});
    const pointer=await page.evaluate(()=>{
      const inst=window.MOVX3D.runtime.instances['boot-tv'],g=inst.crtGlassDepth;
      return {pointerX:g.state.pointerX,pointerY:g.state.pointerY,presence:g.state.presence,uniformX:g.uniforms.pointer.value.x,uniformY:g.uniforms.pointer.value.y,uniformPresence:g.uniforms.presence.value,glassDepth:document.querySelector('#boot').dataset.crtGlassDepth};
    });
    assert.ok(pointer.pointerX>.18&&pointer.presence>.22,'scene pointer did not reach real screen optics');
    assert.ok(Math.abs(pointer.pointerX-pointer.uniformX)<.001&&Math.abs(pointer.pointerY-pointer.uniformY)<.001,'glass pointer uniform is detached from Scene-01 state');
    assert.ok(Math.abs(pointer.presence-pointer.uniformPresence)<.001,'glass presence uniform is detached from Scene-01 state');
    assert.equal(pointer.glassDepth,'engaged');

    await page.locator('[data-crt-mode-control="digital"]').click();
    await page.waitForFunction(()=>{
      const inst=window.MOVX3D.runtime.instances['boot-tv'];
      return inst.channels?.state?.channel==='digital'&&inst.crtGlassDepth?.state?.channel==='digital'&&inst.crtGlassDepth?.state?.tint==='#c7d8ff';
    },null,{timeout:7000,polling:'raf'});
    const digital=await page.evaluate(()=>{
      const boot=document.querySelector('#boot'),g=window.MOVX3D.runtime.instances['boot-tv'].crtGlassDepth;
      return {channel:g.state.channel,tint:g.state.tint,uniformTint:`#${g.uniforms.tint.value.getHexString()}`,physical:boot.dataset.crtPhysicalChannel,glassChannel:boot.dataset.crtGlassChannel,frames:g.state.frames};
    });
    assert.equal(digital.channel,'digital');assert.equal(digital.tint,'#c7d8ff');assert.equal(digital.uniformTint,'#c7d8ff');assert.equal(digital.physical,'digital');assert.equal(digital.glassChannel,'digital');
    assert.equal(errors.length,0,'page errors: '+errors.join(' | '));
    assert.equal(shaderErrors.length,0,'shader errors: '+shaderErrors.join(' | '));
    await page.screenshot({path:'_site/qa-v371-crt-glass-depth-desktop.png',fullPage:false});
    fs.writeFileSync('_site/qa-v371-crt-glass-depth.json',JSON.stringify({initial,pointer,digital},null,2));
    console.log(JSON.stringify({qa:'v371-crt-glass-depth',status:'PASS',initial,pointer,digital}));
    await page.close();

    const reduced=await browser.newPage({viewport:{width:1280,height:800},reducedMotion:'reduce'});
    await reduced.goto('http://127.0.0.1:4173/',{waitUntil:'domcontentloaded',timeout:30000});
    await reduced.waitForFunction(()=>document.querySelector('[data-model-slot="boot-tv"]')?.dataset.glbState==='ready',null,{timeout:25000});
    await reduced.waitForFunction(()=>window.MOVX3D?.runtime?.instances?.['boot-tv']?.crtGlassDepth?.state?.compiled===true,null,{timeout:15000});
    const reducedState=await reduced.evaluate(()=>{const r=window.MOVX3D.runtime,inst=r.instances['boot-tv'],s=inst.crtGlassDepth.state;return {reduced:s.reduced,presence:s.presence,renderers:document.querySelectorAll('.v322-model-renderer').length,activeSlots:r.activeSlots,triangles:inst.stats.triangles}});
    assert.equal(reducedState.reduced,true);assert.ok(reducedState.presence<.01);assert.equal(reducedState.renderers,1);assert.deepEqual(reducedState.activeSlots,['boot-tv']);assert.equal(reducedState.triangles,44831);
    console.log(JSON.stringify({qa:'v371-crt-glass-depth',viewport:'reduced',status:'PASS',reducedState}));
    await reduced.close();
  } finally {await browser.close()}
})().catch(err=>{console.error(err);process.exit(1)});
