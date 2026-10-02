const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');

(async()=>{
  const models=fs.readdirSync('_site/models').filter(x=>x.toLowerCase().endsWith('.glb')).sort();
  assert.deepEqual(models,['movx-crt-tv.glb'],'v376.1 must keep exactly one production GLB');
  const browser=await chromium.launch({headless:true,args:['--no-sandbox','--use-angle=swiftshader','--enable-webgl','--ignore-gpu-blocklist']});
  try{
    const page=await browser.newPage({viewport:{width:1366,height:768},deviceScaleFactor:1});
    const errors=[];page.on('pageerror',e=>errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
    await page.goto('http://127.0.0.1:4173/',{waitUntil:'domcontentloaded',timeout:30000});
    await page.waitForFunction(()=>document.querySelector('[data-model-slot="boot-tv"]')?.dataset.glbState==='ready',null,{timeout:25000});
    await page.waitForFunction(()=>document.documentElement.dataset.crtOrbitPhysics==='v376-elastic-boundary',null,{timeout:10000});
    await page.waitForFunction(()=>document.documentElement.dataset.crtOrbitRecoil==='v376.1-visible-snap',null,{timeout:10000});
    await page.waitForFunction(()=>document.documentElement.dataset.crtSpatialGrab==='v375-ready',null,{timeout:10000});
    await page.waitForFunction(()=>document.documentElement.dataset.crtInputSurface==='v386.9-scene-field',null,{timeout:5000});

    const findBodyPoint=()=>page.evaluate(async()=>{
      const THREE=await import('./vendor/three.module.js');
      const i=window.MOVX3D.runtime.instances['boot-tv'];
      const ray=new THREE.Raycaster(),p=new THREE.Vector2(),r=i.canvas.getBoundingClientRect();
      const screen=i.channels.screen,knob=i.model.getObjectByName('tripo_part_8');
      knob.geometry.computeBoundingBox();const kc=knob.geometry.boundingBox.getCenter(new THREE.Vector3());knob.localToWorld(kc);kc.project(i.camera);
      const knobPoint={x:r.x+(kc.x+1)*r.width/2,y:r.y+(1-kc.y)*r.height/2};
      const selectorRadius=Math.max(24,Math.min(36,r.width*.042))+22;
      const candidates=[[.16,.24],[.24,.24],[.34,.22],[.64,.22],[.76,.24],[.84,.30],[.14,.43],[.82,.45],[.16,.62],[.82,.64],[.22,.77],[.70,.78],[.36,.86],[.58,.86]];
      for(const [fx,fy] of candidates){
        const x=r.x+fx*r.width,y=r.y+fy*r.height;
        if(Math.hypot(x-knobPoint.x,y-knobPoint.y)<=selectorRadius)continue;
        p.set(fx*2-1,-(fy*2-1));ray.setFromCamera(p,i.camera);
        const hit=ray.intersectObject(i.model,true)[0]?.object;
        if(hit&&hit!==screen&&hit!==knob)return{x,y,name:hit.name,knobPoint,selectorRadius};
      }
      return null;
    });
    const stillBody=point=>page.evaluate(async point=>{
      const THREE=await import('./vendor/three.module.js');
      const i=window.MOVX3D.runtime.instances['boot-tv'],r=i.canvas.getBoundingClientRect();
      const screen=i.channels.screen,knob=i.model.getObjectByName('tripo_part_8');
      knob.geometry.computeBoundingBox();const kc=knob.geometry.boundingBox.getCenter(new THREE.Vector3());knob.localToWorld(kc);kc.project(i.camera);
      const knobPoint={x:r.x+(kc.x+1)*r.width/2,y:r.y+(1-kc.y)*r.height/2};
      const selectorRadius=Math.max(24,Math.min(36,r.width*.042))+18;
      if(Math.hypot(point.x-knobPoint.x,point.y-knobPoint.y)<=selectorRadius)return false;
      const ndc=new THREE.Vector2((point.x-r.x)/r.width*2-1,-(point.y-r.y)/r.height*2+1),ray=new THREE.Raycaster();
      ray.setFromCamera(ndc,i.camera);const hit=ray.intersectObject(i.model,true)[0]?.object;
      return !!hit&&hit!==screen&&hit!==knob;
    },point);
    const bodyPoint=async()=>{
      let point=null;
      for(let attempt=0;attempt<6;attempt++){
        point=await findBodyPoint();assert.ok(point,`elastic QA could not find visible cabinet body on attempt ${attempt+1}`);
        const frame=await page.evaluate(()=>Number(document.querySelector('#boot')?.dataset.v371Frame||0));
        await page.mouse.move(point.x,point.y,{steps:attempt?3:6});
        await page.waitForFunction(previous=>Number(document.querySelector('#boot')?.dataset.v371Frame||0)>previous,frame,{timeout:4000,polling:'raf'});
        if(await stillBody(point))return {...point,attempts:attempt+1};
      }
      assert.fail(`elastic QA cabinet body never converged under live parallax: ${JSON.stringify(point)}`);
    };

    const snap=()=>page.evaluate(()=>{
      const root=document.documentElement,boot=document.querySelector('#boot'),i=window.MOVX3D.runtime.instances['boot-tv'];
      const o=i.objectInteraction.state,g=i.spatialGrab.state;
      return {
        layer:root.dataset.crtOrbitPhysicsLayer,recoilLayer:root.dataset.crtOrbitRecoilLayer,
        ready:root.dataset.crtOrbitPhysics,recoilReady:root.dataset.crtOrbitRecoil,inputSurface:root.dataset.crtInputSurface,
        grab:boot.dataset.crtGrab,boundary:boot.dataset.crtBoundary||'',
        active:o.active,yaw:o.yaw,pitch:o.pitch,velocityYaw:o.velocityYaw,pointerVelocityYaw:o.pointerVelocityYaw,
        edgeYaw:o.edgeCompressionYaw,bounce:o.boundaryBounce,boundaryHits:o.boundaryHits,lastSnapYaw:o.lastBoundarySnapYaw,
        spatialMix:g.mix,camX:i.camera.position.x,triangles:i.stats.triangles,
        renderers:document.querySelectorAll('.v322-model-renderer').length,activeSlots:window.MOVX3D.runtime.activeSlots,
        overflow:root.scrollWidth-innerWidth,errors:window.MOVX3D.runtime.errors,
      };
    });

    const initial=await snap();
    assert.equal(initial.layer,'v376-elastic-boundary');assert.equal(initial.recoilLayer,'v376-1-visible-recoil');
    assert.equal(initial.ready,'v376-elastic-boundary');assert.equal(initial.recoilReady,'v376.1-visible-snap');
    assert.equal(initial.inputSurface,'v386.9-scene-field');
    assert.equal(initial.triangles,44831);assert.equal(initial.renderers,1);assert.deepEqual(initial.activeSlots,['boot-tv']);assert.ok(initial.overflow<=2);

    const p=await bodyPoint();
    await page.mouse.down();
    await page.waitForFunction(()=>{
      const i=window.MOVX3D.runtime.instances['boot-tv'];return i.objectInteraction.state.active&&i.directManipulation.state.active===false;
    },null,{timeout:2500,polling:'raf'});
    await page.mouse.move(p.x+165,p.y-20,{steps:14});
    await page.waitForFunction(()=>{
      const i=window.MOVX3D.runtime.instances['boot-tv'],o=i.objectInteraction.state;
      return o.active&&o.yaw>.495&&o.edgeCompressionYaw>.25&&o.pointerVelocityYaw>.05&&o.boundaryHits>0;
    },null,{timeout:6000,polling:'raf'});
    const compressed=await snap();
    assert.ok(compressed.yaw<=.5001,'elastic orbit escaped the authored yaw safety limit');
    assert.ok(compressed.edgeYaw>.25,'orbit stop did not accumulate physical compression');
    assert.ok(compressed.pointerVelocityYaw>.05,'pointer-derived momentum died at the safety stop');
    assert.ok(compressed.boundaryHits>0);assert.ok(['yaw','both'].includes(compressed.boundary));
    await page.locator('#boot').screenshot({path:'_site/qa-v376-elastic-stop-compressed.png'});

    await page.mouse.up();
    await page.waitForFunction(()=>{
      const o=window.MOVX3D.runtime.instances['boot-tv'].objectInteraction.state;
      return !o.active&&o.velocityYaw<-.02&&o.boundaryBounce>.02&&o.lastBoundarySnapYaw>.008&&o.yaw<.492;
    },null,{timeout:2500,polling:'raf'});
    const released=await snap();
    assert.ok(released.lastSnapYaw>.008,'compressed stop did not apply an immediate visible inward snap');
    assert.ok(released.yaw<compressed.yaw-.008,`release frame stayed visually pinned to the boundary: ${compressed.yaw} -> ${released.yaw}`);
    assert.ok(released.velocityYaw<-.02,'release at the hard stop did not convert outward momentum into inward recoil');
    assert.ok(released.bounce>.02,'elastic boundary produced no rebound energy');
    assert.equal(released.grab,'inertia');assert.ok(released.spatialMix>.08,'scene camera/light did not carry the physical rebound');

    await page.waitForTimeout(180);
    const recoil=await snap();
    assert.ok(recoil.yaw<=released.yaw+.002,`cabinet moved back toward the hard stop after recoil: ${released.yaw} -> ${recoil.yaw}`);
    assert.ok(Math.abs(recoil.yaw)<=.5001,'recoil exceeded authored orbit safety limit');
    assert.equal(recoil.renderers,1);assert.deepEqual(recoil.activeSlots,['boot-tv']);assert.ok(recoil.overflow<=2);
    assert.equal(errors.length,0,'desktop page errors: '+errors.join(' | '));
    fs.writeFileSync('_site/qa-v376-elastic-orbit.json',JSON.stringify({initial,pick:p,compressed,released,recoil},null,2));
    console.log(JSON.stringify({qa:'v376.1-crt-elastic-orbit',status:'PASS',pickAttempts:p.attempts,compressed,released,recoil}));
    await page.close();

    const reduced=await browser.newPage({viewport:{width:1280,height:800},reducedMotion:'reduce'});
    await reduced.goto('http://127.0.0.1:4173/',{waitUntil:'domcontentloaded',timeout:30000});
    await reduced.waitForFunction(()=>document.querySelector('[data-model-slot="boot-tv"]')?.dataset.glbState==='ready',null,{timeout:25000});
    await reduced.waitForFunction(()=>document.documentElement.dataset.crtOrbitRecoil==='v376.1-visible-snap',null,{timeout:10000});
    const reducedState=await reduced.evaluate(()=>{const i=window.MOVX3D.runtime.instances['boot-tv'],o=i.objectInteraction.state;return {reduced:o.reduced,bounce:o.boundaryBounce,lastSnapYaw:o.lastBoundarySnapYaw,renderers:document.querySelectorAll('.v322-model-renderer').length,activeSlots:window.MOVX3D.runtime.activeSlots,overflow:document.documentElement.scrollWidth-innerWidth}});
    assert.equal(reducedState.reduced,true);assert.equal(reducedState.bounce,0);assert.equal(reducedState.lastSnapYaw,0);assert.equal(reducedState.renderers,1);assert.deepEqual(reducedState.activeSlots,['boot-tv']);assert.ok(reducedState.overflow<=2);
    console.log(JSON.stringify({qa:'v376.1-crt-elastic-orbit',viewport:'reduced',status:'PASS',reducedState}));
    await reduced.close();
  } finally {await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});