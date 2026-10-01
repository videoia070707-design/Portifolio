const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');

(async()=>{
  const models=fs.readdirSync('_site/models').filter(x=>x.toLowerCase().endsWith('.glb')).sort();
  assert.deepEqual(models,['movx-crt-tv.glb'],'v377 must keep exactly one production GLB');
  const browser=await chromium.launch({headless:true,args:['--no-sandbox','--use-angle=swiftshader','--enable-webgl','--ignore-gpu-blocklist']});
  try{
    const page=await browser.newPage({viewport:{width:1366,height:768},deviceScaleFactor:1});
    const errors=[];page.on('pageerror',e=>errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
    await page.goto('http://127.0.0.1:4173/',{waitUntil:'domcontentloaded',timeout:30000});
    await page.waitForFunction(()=>document.querySelector('[data-model-slot="boot-tv"]')?.dataset.glbState==='ready',null,{timeout:25000});
    await page.waitForFunction(()=>document.documentElement.dataset.crtFocusPull==='v377-ready',null,{timeout:10000});
    await page.waitForFunction(()=>Number(document.querySelector('#boot')?.dataset.v377Frame||0)>6,null,{timeout:5000,polling:'raf'});

    const bodyPoint=()=>page.evaluate(async()=>{
      const THREE=await import('./vendor/three.module.js');
      const i=window.MOVX3D.runtime.instances['boot-tv'];
      const ray=new THREE.Raycaster(),p=new THREE.Vector2(),r=i.canvas.getBoundingClientRect();
      const screen=i.channels.screen,knob=i.model.getObjectByName('tripo_part_8');
      for(const fy of [.26,.35,.56,.70,.80])for(const fx of [.20,.27,.73,.80,.39,.61]){
        p.set(fx*2-1,-(fy*2-1));ray.setFromCamera(p,i.camera);
        const hit=ray.intersectObject(i.model,true)[0]?.object;
        if(hit&&hit!==screen&&hit!==knob)return{x:r.x+fx*r.width,y:r.y+fy*r.height,name:hit.name};
      }
      return null;
    });
    const snap=()=>page.evaluate(()=>{
      const root=document.documentElement,boot=document.querySelector('#boot'),i=window.MOVX3D.runtime.instances['boot-tv'];
      const g=i.spatialGrab.state,o=i.objectInteraction.state,copy=boot.querySelector('.boot-copy');
      const cs=getComputedStyle(copy),rect=copy.getBoundingClientRect();
      return {
        layer:root.dataset.crtFocusPullLayer,ready:root.dataset.crtFocusPull,
        focusState:boot.dataset.v377Focus,grab:boot.dataset.v375Grab,
        focus:g.focus,pressure:g.pressure,mix:g.mix,active:o.active,
        groupZ:i.group.position.z,groupY:i.group.position.y,cameraZ:i.camera.position.z,
        keyIntensity:i.lights?.key?.intensity||0,
        copyX:rect.x,copyY:rect.y,copyWidth:rect.width,
        copyTransform:cs.transform,copyTranslate:cs.translate,copyScale:cs.scale,copyOpacity:Number(cs.opacity),copyFilter:cs.filter,
        renderers:document.querySelectorAll('.v322-model-renderer').length,
        activeSlots:window.MOVX3D.runtime.activeSlots,triangles:i.stats.triangles,
        overflow:root.scrollWidth-innerWidth,errors:window.MOVX3D.runtime.errors,
      };
    });

    const initial=await snap();
    assert.equal(initial.layer,'v377-physical-focus-pull');assert.equal(initial.ready,'v377-ready');
    assert.ok(initial.focus<.05);assert.equal(initial.focusState,'idle');
    assert.equal(initial.renderers,1);assert.deepEqual(initial.activeSlots,['boot-tv']);assert.equal(initial.triangles,44831);assert.ok(initial.overflow<=2);

    const p=await bodyPoint();assert.ok(p,'v377 could not find a visible CRT cabinet surface');
    await page.mouse.move(p.x,p.y,{steps:4});await page.mouse.down();
    await page.mouse.move(p.x+78,p.y-24,{steps:10});
    await page.waitForFunction(()=>{
      const i=window.MOVX3D.runtime.instances['boot-tv'];
      return i.objectInteraction.state.active&&i.spatialGrab.state.focus>.72&&document.querySelector('#boot')?.dataset.v377Focus==='held';
    },null,{timeout:5000,polling:'raf'});
    const held=await snap();
    assert.equal(held.active,true);assert.equal(held.focusState,'held');assert.ok(held.focus>.72);assert.ok(held.pressure>.45);
    assert.ok(held.copyX>initial.copyX+6,`editorial copy did not physically recede to the right: ${initial.copyX} -> ${held.copyX}`);
    assert.notEqual(held.copyTranslate,'none','independent translate focus-pull did not resolve');
    assert.notEqual(held.copyScale,'none','independent scale focus-pull did not resolve');
    assert.ok(/opacity\(/.test(held.copyFilter),`editorial focus filter missing: ${held.copyFilter}`);
    assert.ok(held.groupZ>initial.groupZ+.012,`real CRT received no held-state depth lift: ${initial.groupZ} -> ${held.groupZ}`);
    assert.ok(held.keyIntensity>initial.keyIntensity+.06,'existing room key light did not gain held-state pressure');
    await page.locator('#boot').screenshot({path:'_site/qa-v377-focus-pull-held.png'});

    await page.mouse.up();
    /* The release is spring-damped and shares the same SwiftShader frame with the
       newer Scene-01 layers. Gate the actual physical state transition first,
       then wait for measurable decay from the captured held focus instead of
       assuming every runner crosses a magic [.04,.55] window inside 3.5 seconds. */
    await page.waitForFunction(()=>!window.MOVX3D.runtime.instances['boot-tv'].objectInteraction.state.active,null,{timeout:3000,polling:'raf'});
    await page.waitForFunction(heldFocus=>{
      const i=window.MOVX3D.runtime.instances['boot-tv'];
      const f=i.spatialGrab.state.focus;
      return !i.objectInteraction.state.active && f<heldFocus*.72 && f>.025;
    },held.focus,{timeout:8000,polling:'raf'});
    const releasing=await snap();
    assert.equal(releasing.active,false);assert.equal(releasing.focusState,'releasing');
    assert.ok(releasing.copyX<held.copyX,'editorial copy did not return with physical release');
    assert.ok(releasing.focus<held.focus*.72,'focus pull did not materially decay after release');
    assert.equal(errors.length,0,'desktop page errors: '+errors.join(' | '));
    fs.writeFileSync('_site/qa-v377-focus-pull.json',JSON.stringify({initial,held,releasing},null,2));
    console.log(JSON.stringify({qa:'v377-physical-focus-pull',viewport:'desktop',status:'PASS',initial,held,releasing}));
    await page.close();

    const mobile=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:1});
    await mobile.goto('http://127.0.0.1:4173/',{waitUntil:'domcontentloaded',timeout:30000});
    await mobile.waitForFunction(()=>document.querySelector('[data-model-slot="boot-tv"]')?.dataset.glbState==='ready',null,{timeout:25000});
    await mobile.waitForFunction(()=>document.documentElement.dataset.crtFocusPull==='v377-ready',null,{timeout:10000});
    const mobileState=await mobile.evaluate(()=>{const i=window.MOVX3D.runtime.instances['boot-tv'],cs=getComputedStyle(document.querySelector('#boot .boot-copy'));return {coarse:i.spatialGrab.state.coarse,focus:i.spatialGrab.state.focus,translate:cs.translate,scale:cs.scale,filter:cs.filter,opacity:Number(cs.opacity),renderers:document.querySelectorAll('.v322-model-renderer').length,activeSlots:window.MOVX3D.runtime.activeSlots,overflow:document.documentElement.scrollWidth-innerWidth}});
    assert.equal(mobileState.coarse,true);assert.ok(mobileState.focus<.01);assert.ok(mobileState.translate==='none'||mobileState.translate==='0px');assert.ok(mobileState.scale==='none'||mobileState.scale==='1');assert.equal(mobileState.filter,'none');assert.equal(mobileState.opacity,1);assert.equal(mobileState.renderers,1);assert.deepEqual(mobileState.activeSlots,['boot-tv']);assert.ok(mobileState.overflow<=2);
    console.log(JSON.stringify({qa:'v377-physical-focus-pull',viewport:'mobile',status:'PASS',mobileState}));
    await mobile.close();

    const reduced=await browser.newPage({viewport:{width:1280,height:800},reducedMotion:'reduce'});
    await reduced.goto('http://127.0.0.1:4173/',{waitUntil:'domcontentloaded',timeout:30000});
    await reduced.waitForFunction(()=>document.querySelector('[data-model-slot="boot-tv"]')?.dataset.glbState==='ready',null,{timeout:25000});
    await reduced.waitForFunction(()=>document.documentElement.dataset.crtFocusPull==='v377-ready',null,{timeout:10000});
    const reducedState=await reduced.evaluate(()=>{const i=window.MOVX3D.runtime.instances['boot-tv'],cs=getComputedStyle(document.querySelector('#boot .boot-copy'));return {reduced:i.spatialGrab.state.reduced,focus:i.spatialGrab.state.focus,translate:cs.translate,scale:cs.scale,filter:cs.filter,opacity:Number(cs.opacity),renderers:document.querySelectorAll('.v322-model-renderer').length,activeSlots:window.MOVX3D.runtime.activeSlots}});
    assert.equal(reducedState.reduced,true);assert.ok(reducedState.translate==='none'||reducedState.translate==='0px');assert.ok(reducedState.scale==='none'||reducedState.scale==='1');assert.equal(reducedState.filter,'none');assert.equal(reducedState.opacity,1);assert.equal(reducedState.renderers,1);assert.deepEqual(reducedState.activeSlots,['boot-tv']);
    console.log(JSON.stringify({qa:'v377-physical-focus-pull',viewport:'reduced',status:'PASS',reducedState}));
    await reduced.close();
  } finally {await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
