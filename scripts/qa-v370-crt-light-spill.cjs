const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');

(async()=>{
  const models=fs.readdirSync('_site/models').filter(x=>x.toLowerCase().endsWith('.glb')).sort();
  assert.deepEqual(models,['movx-crt-tv.glb'],'v370 must keep exactly one production GLB');
  const browser=await chromium.launch({headless:true,args:['--no-sandbox','--use-angle=swiftshader','--enable-webgl','--ignore-gpu-blocklist']});
  try{
    const page=await browser.newPage({viewport:{width:1440,height:1000},deviceScaleFactor:1});
    const errors=[];page.on('pageerror',e=>errors.push(String(e)));
    await page.goto('http://127.0.0.1:4173/',{waitUntil:'domcontentloaded',timeout:30000});
    await page.waitForFunction(()=>document.querySelector('[data-model-slot="boot-tv"]')?.dataset.glbState==='ready',null,{timeout:25000});
    await page.waitForFunction(()=>document.querySelector('#boot')?.dataset.crtPhysicalChannel==='direction',null,{timeout:12000});

    const snap=()=>page.evaluate(()=>{
      const root=document.documentElement,boot=document.querySelector('#boot'),stage=boot.querySelector('.boot-stage'),wrap=boot.querySelector('.crt-wrap');
      const stageBefore=getComputedStyle(stage,'::before');const wrapAfter=getComputedStyle(wrap,'::after');
      return {
        layer:root.dataset.crtLightSpillLayer,
        channel:boot.dataset.crtPhysicalChannel,
        stageBg:stageBefore.backgroundImage,
        stageOpacity:stageBefore.opacity,
        wrapBg:wrapAfter.backgroundImage,
        wrapOpacity:wrapAfter.opacity,
        renderers:document.querySelectorAll('.v322-model-renderer').length,
        activeSlots:window.MOVX3D.runtime.activeSlots,
        triangles:window.MOVX3D.runtime.instances['boot-tv'].stats.triangles,
        overflow:root.scrollWidth-innerWidth,
        errors:window.MOVX3D.runtime.errors,
      };
    });

    const direction=await snap();
    assert.equal(direction.layer,'v370-screen-to-room');
    assert.equal(direction.channel,'direction');
    assert.ok(direction.stageBg.includes('radial-gradient'),'stage spill is not rendered');
    assert.ok(direction.wrapBg.includes('radial-gradient'),'local CRT spill is not rendered');
    assert.equal(direction.renderers,1);assert.deepEqual(direction.activeSlots,['boot-tv']);assert.equal(direction.triangles,44831);assert.ok(direction.overflow<=2);assert.equal(direction.errors.length,0);

    await page.locator('[data-crt-mode-control="motion"]').click();
    await page.waitForFunction(()=>document.querySelector('#boot')?.dataset.crtPhysicalChannel==='motion');
    await page.waitForTimeout(500);
    const motion=await snap();
    assert.equal(motion.channel,'motion');
    assert.notEqual(motion.stageBg,direction.stageBg,'Motion must change room bounce');
    assert.notEqual(motion.wrapBg,direction.wrapBg,'Motion must change local CRT spill');

    await page.locator('[data-crt-mode-control="digital"]').click();
    await page.waitForFunction(()=>document.querySelector('#boot')?.dataset.crtPhysicalChannel==='digital');
    await page.waitForTimeout(500);
    const digital=await snap();
    assert.equal(digital.channel,'digital');
    assert.notEqual(digital.stageBg,motion.stageBg,'Digital must have a distinct screen-to-room palette');
    assert.notEqual(digital.wrapBg,motion.wrapBg,'Digital local spill must be distinct');
    assert.equal(digital.renderers,1);assert.deepEqual(digital.activeSlots,['boot-tv']);assert.equal(digital.triangles,44831);assert.equal(errors.length,0,'page errors: '+errors.join(' | '));

    const activeControl=await page.locator('[data-crt-mode-control="digital"]').evaluate(el=>({pressed:el.getAttribute('aria-pressed'),before:getComputedStyle(el,'::before').opacity,after:getComputedStyle(el,'::after').height}));
    assert.equal(activeControl.pressed,'true');assert.ok(Number(activeControl.before)>.5,'active channel lacks reflected tint');assert.equal(activeControl.after,'3px');

    await page.screenshot({path:'_site/qa-v370-crt-light-spill-desktop.png',fullPage:false});
    console.log(JSON.stringify({qa:'v370-crt-light-spill',status:'PASS',direction,motion,digital,activeControl}));
    await page.close();

    const reduced=await browser.newPage({viewport:{width:1280,height:800},reducedMotion:'reduce'});
    await reduced.goto('http://127.0.0.1:4173/',{waitUntil:'domcontentloaded',timeout:30000});
    await reduced.waitForFunction(()=>document.documentElement.dataset.crtLightSpillLayer==='v370-screen-to-room');
    const reducedState=await reduced.evaluate(()=>{const stage=document.querySelector('#boot .boot-stage'),wrap=document.querySelector('#boot .crt-wrap');return {stageTransition:getComputedStyle(stage,'::before').transitionDuration,stageTransform:getComputedStyle(stage,'::before').transform,wrapTransition:getComputedStyle(wrap,'::after').transitionDuration,renderers:document.querySelectorAll('.v322-model-renderer').length}});
    assert.equal(reducedState.stageTransition,'0s');assert.equal(reducedState.wrapTransition,'0s');assert.equal(reducedState.stageTransform,'none');assert.equal(reducedState.renderers,1);
    console.log(JSON.stringify({qa:'v370-crt-light-spill',viewport:'reduced',status:'PASS',reducedState}));
    await reduced.close();
  } finally {await browser.close()}
})().catch(err=>{console.error(err);process.exit(1)});
