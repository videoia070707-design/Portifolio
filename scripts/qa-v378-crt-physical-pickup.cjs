const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');

(async()=>{
  const models=fs.readdirSync('_site/models').filter(x=>x.toLowerCase().endsWith('.glb')).sort();
  assert.deepEqual(models,['movx-crt-tv.glb'],'v378 must keep exactly one production GLB');
  const browser=await chromium.launch({headless:true,args:['--no-sandbox','--use-angle=swiftshader','--enable-webgl','--ignore-gpu-blocklist']});
  try{
    const page=await browser.newPage({viewport:{width:1366,height:768},deviceScaleFactor:1});
    const errors=[];page.on('pageerror',e=>errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
    await page.goto('http://127.0.0.1:4173/',{waitUntil:'domcontentloaded',timeout:30000});
    await page.waitForFunction(()=>document.querySelector('[data-model-slot="boot-tv"]')?.dataset.glbState==='ready',null,{timeout:25000});
    await page.waitForFunction(()=>document.documentElement.dataset.crtPhysicalPickup==='v378-ready',null,{timeout:10000});
    await page.waitForFunction(()=>Number(document.querySelector('#boot')?.dataset.v378Frame||0)>6,null,{timeout:5000,polling:'raf'});

    const bodyPoint=()=>page.evaluate(async()=>{
      const THREE=await import('./vendor/three.module.js');
      const i=window.MOVX3D.runtime.instances['boot-tv'];
      const ray=new THREE.Raycaster(),p=new THREE.Vector2(),r=i.canvas.getBoundingClientRect();
      const screen=i.channels.screen,knob=i.model.getObjectByName('tripo_part_8');
      for(const fy of [.24,.32,.53,.69,.80])for(const fx of [.18,.25,.73,.81,.39,.61]){
        p.set(fx*2-1,-(fy*2-1));ray.setFromCamera(p,i.camera);
        const hit=ray.intersectObject(i.model,true)[0]?.object;
        if(hit&&hit!==screen&&hit!==knob)return{x:r.x+fx*r.width,y:r.y+fy*r.height,name:hit.name};
      }
      return null;
    });
    const snap=()=>page.evaluate(()=>{
      const root=document.documentElement,boot=document.querySelector('#boot'),i=window.MOVX3D.runtime.instances['boot-tv'];
      const p=i.physicalPickup.state,o=i.objectInteraction.state,g=i.spatialGrab.state;
      return {
        layer:root.dataset.crtPickupLayer,ready:root.dataset.crtPhysicalPickup,loop:root.dataset.crtPhysicalPickupLoop,
        phase:boot.dataset.v378Pickup,bodyHit:boot.dataset.crtObjectHit||'',
        hover:p.hover,hold:p.hold,handX:p.handX,handY:p.handY,lift:p.lift,depth:p.depth,pressure:p.pressure,
        orbitActive:o.active,focus:g.focus,groupX:i.group.position.x,groupY:i.group.position.y,groupZ:i.group.position.z,
        hint:document.querySelector('.crt-object-hint span')?.textContent||'',
        renderers:document.querySelectorAll('.v322-model-renderer').length,activeSlots:window.MOVX3D.runtime.activeSlots,
        triangles:i.stats.triangles,overflow:root.scrollWidth-innerWidth,errors:window.MOVX3D.runtime.errors,
      };
    });

    const initial=await snap();
    assert.equal(initial.layer,'v378-physical-pickup');assert.equal(initial.ready,'v378-ready');assert.equal(initial.loop,'shared-v322-frame');
    assert.ok(initial.hover<.05);assert.ok(initial.hold<.05);assert.equal(initial.renderers,1);assert.deepEqual(initial.activeSlots,['boot-tv']);assert.equal(initial.triangles,44831);assert.ok(initial.overflow<=2);

    const p=await bodyPoint();assert.ok(p,'v378 could not find a visible CRT cabinet surface');
    await page.mouse.move(p.x,p.y,{steps:8});
    /* The hover semantic marker and the physical depth use separate dampers. In a
       long SwiftShader suite the marker can cross its threshold one frame before
       the forward lift does. Wait for the same >.003 depth that we assert below;
       the contract stays strict and no runtime threshold is weakened. */
    await page.waitForFunction(()=>{
      const i=window.MOVX3D.runtime.instances['boot-tv'];
      return document.querySelector('#boot')?.dataset.crtObjectHit==='body'&&i.physicalPickup.state.hover>.55&&i.physicalPickup.state.depth>.003&&document.querySelector('#boot')?.dataset.v378Pickup==='hover';
    },null,{timeout:6500,polling:'raf'});
    const hovered=await snap();
    assert.equal(hovered.phase,'hover');assert.ok(hovered.hover>.55);assert.ok(hovered.depth>.003,'cabinet did not lift forward on physical hover');
    assert.ok(/SEGURE E ARRASTE/.test(hovered.hint),'hover affordance does not describe physical pickup');

    await page.mouse.down();
    await page.mouse.move(p.x+76,p.y-28,{steps:12});
    await page.waitForFunction(()=>{
      const i=window.MOVX3D.runtime.instances['boot-tv'],p=i.physicalPickup.state;
      return i.objectInteraction.state.active&&p.hold>.70&&p.handX>.004&&p.handY>.001&&document.querySelector('#boot')?.dataset.v378Pickup==='held'&&i.spatialGrab.state.focus>.55;
    },null,{timeout:6000,polling:'raf'});
    const held=await snap();
    assert.equal(held.phase,'held');assert.equal(held.orbitActive,true);assert.ok(held.hold>.70);assert.ok(held.handX>.004);assert.ok(held.handY>.001);
    assert.ok(held.depth>hovered.depth+.004,`held cabinet did not gain additional pickup depth: ${hovered.depth} -> ${held.depth}`);
    assert.ok(held.focus>.55,'v377 focus pull stopped participating in the physical pickup');
    await page.locator('#boot').screenshot({path:'_site/qa-v378-physical-pickup-held.png'});

    await page.mouse.up();
    await page.waitForFunction(()=>{
      const i=window.MOVX3D.runtime.instances['boot-tv'],p=i.physicalPickup.state;
      return !i.objectInteraction.state.active&&p.hold<.58&&p.hold>.03&&document.querySelector('#boot')?.dataset.v378Pickup==='releasing';
    },null,{timeout:3500,polling:'raf'});
    const releasing=await snap();
    assert.equal(releasing.orbitActive,false);assert.equal(releasing.phase,'releasing');assert.ok(releasing.hold<held.hold);assert.ok(Math.abs(releasing.handX)<Math.abs(held.handX),'held hand translation did not begin settling after release');

    const settleStarted=Date.now();
    await page.waitForFunction(()=>{
      const p=window.MOVX3D.runtime.instances['boot-tv'].physicalPickup.state;
      return p.hold<.025&&Math.abs(p.handX)<.0025&&Math.abs(p.handY)<.0025&&document.querySelector('#boot')?.dataset.v378Pickup==='idle';
    },null,{timeout:9000,polling:'raf'});
    const settleMs=Date.now()-settleStarted;
    const settled=await snap();
    assert.equal(settled.phase,'idle');assert.ok(settled.hold<.025);assert.ok(Math.abs(settled.handX)<.0025);assert.ok(settleMs<9000);assert.equal(errors.length,0,'desktop page errors: '+errors.join(' | '));
    fs.writeFileSync('_site/qa-v378-physical-pickup.json',JSON.stringify({initial,hovered,held,releasing,settled,settleMs},null,2));
    console.log(JSON.stringify({qa:'v378-crt-physical-pickup',viewport:'desktop',status:'PASS',hovered,held,releasing,settled,settleMs}));
    await page.close();

    const mobile=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:1});
    await mobile.goto('http://127.0.0.1:4173/',{waitUntil:'domcontentloaded',timeout:30000});
    await mobile.waitForFunction(()=>document.querySelector('[data-model-slot="boot-tv"]')?.dataset.glbState==='ready',null,{timeout:25000});
    await mobile.waitForFunction(()=>document.documentElement.dataset.crtPhysicalPickup==='v378-ready',null,{timeout:10000});
    const mobileState=await mobile.evaluate(()=>{const root=document.documentElement,i=window.MOVX3D.runtime.instances['boot-tv'],p=i.physicalPickup.state;return {coarse:p.coarse,hover:p.hover,hold:p.hold,handX:p.handX,hint:getComputedStyle(document.querySelector('.crt-object-hint')).display,renderers:document.querySelectorAll('.v322-model-renderer').length,activeSlots:window.MOVX3D.runtime.activeSlots,overflow:root.scrollWidth-innerWidth}});
    assert.equal(mobileState.coarse,true);assert.ok(mobileState.hover<.01);assert.ok(mobileState.hold<.01);assert.ok(Math.abs(mobileState.handX)<.001);assert.equal(mobileState.hint,'none');assert.equal(mobileState.renderers,1);assert.deepEqual(mobileState.activeSlots,['boot-tv']);assert.ok(mobileState.overflow<=2);
    console.log(JSON.stringify({qa:'v378-crt-physical-pickup',viewport:'mobile',status:'PASS',mobileState}));
    await mobile.close();

    const reducedPage=await browser.newPage({viewport:{width:1280,height:800},reducedMotion:'reduce'});
    await reducedPage.goto('http://127.0.0.1:4173/',{waitUntil:'domcontentloaded',timeout:30000});
    await reducedPage.waitForFunction(()=>document.querySelector('[data-model-slot="boot-tv"]')?.dataset.glbState==='ready',null,{timeout:25000});
    await reducedPage.waitForFunction(()=>document.documentElement.dataset.crtPhysicalPickup==='v378-ready',null,{timeout:10000});
    const reducedState=await reducedPage.evaluate(()=>{const i=window.MOVX3D.runtime.instances['boot-tv'],p=i.physicalPickup.state;return {reduced:p.reduced,hover:p.hover,hold:p.hold,renderers:document.querySelectorAll('.v322-model-renderer').length,activeSlots:window.MOVX3D.runtime.activeSlots,overflow:document.documentElement.scrollWidth-innerWidth}});
    assert.equal(reducedState.reduced,true);assert.ok(reducedState.hover<.01);assert.ok(reducedState.hold<.01);assert.equal(reducedState.renderers,1);assert.deepEqual(reducedState.activeSlots,['boot-tv']);assert.ok(reducedState.overflow<=2);
    console.log(JSON.stringify({qa:'v378-crt-physical-pickup',viewport:'reduced',status:'PASS',reducedState}));
    await reducedPage.close();
  } finally {await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
