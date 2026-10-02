const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');

(async()=>{
  const browser=await chromium.launch({args:['--no-sandbox','--use-angle=swiftshader','--enable-webgl','--ignore-gpu-blocklist']});
  const results=[];
  for(const cfg of [
    {name:'desktop',viewport:{width:1366,height:768}},
    {name:'mobile',viewport:{width:390,height:844},isMobile:true,hasTouch:true},
    {name:'reduced',viewport:{width:1280,height:800},reducedMotion:'reduce'}
  ]){
    const page=await browser.newPage(cfg),errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
    await page.goto(process.env.MOVX_TEST_URL||'http://127.0.0.1:4173/',{waitUntil:'domcontentloaded'});
    await page.waitForFunction(()=>window.MOVX3D?.runtime?.instances?.['boot-tv']?.objectInteraction?.state,null,{timeout:30000});
    await page.waitForFunction(()=>document.documentElement.dataset.crtObject==='v364-ready',null,{timeout:10000});

    const snapshot=()=>page.evaluate(()=>{
      const i=window.MOVX3D.runtime.instances['boot-tv'],o=i.objectInteraction.state;
      return {
        yaw:o.yaw,pitch:o.pitch,bodyDrags:o.bodyDrags,lastAction:o.lastAction,active:o.active,
        group:{x:i.group.rotation.x,y:i.group.rotation.y,z:i.group.rotation.z},
        channel:i.channels.state.channel,art:i.channels.state.art,
        triangles:i.stats.triangles,canvases:document.querySelectorAll('.v322-model-renderer canvas').length,
        overflow:document.documentElement.scrollWidth-innerWidth,
        marker:document.documentElement.dataset.crtObject||null,
        orbitPhysics:document.documentElement.dataset.crtOrbitPhysics||null,
        bodyHit:document.querySelector('#boot')?.dataset.crtObjectHit||'',
        grab:document.querySelector('#boot')?.dataset.crtGrab||'',
        hint:document.querySelector('.crt-object-hint')?.textContent||''
      };
    });

    const bodyPoint=()=>page.evaluate(async()=>{
      const THREE=await import('./vendor/three.module.js');
      const i=window.MOVX3D.runtime.instances['boot-tv'];
      const ray=new THREE.Raycaster(),p=new THREE.Vector2(),r=i.canvas.getBoundingClientRect();
      const screen=i.channels.screen,knob=i.model.getObjectByName('tripo_part_8');
      const xs=[.16,.22,.78,.84,.5,.30,.70],ys=[.34,.68,.82,.24,.55];
      for(const fy of ys)for(const fx of xs){
        p.set(fx*2-1,-(fy*2-1));ray.setFromCamera(p,i.camera);
        const hit=ray.intersectObject(i.model,true)[0]?.object;
        if(hit&&hit!==screen&&hit!==knob)return{x:r.x+fx*r.width,y:r.y+fy*r.height,name:hit.name};
      }
      return null;
    });

    const framing=()=>page.evaluate(async()=>{
      const THREE=await import('./vendor/three.module.js');
      const i=window.MOVX3D.runtime.instances['boot-tv'];i.scene.updateMatrixWorld(true);i.camera.updateMatrixWorld(true);
      const r=i.canvas.getBoundingClientRect(),scene=document.querySelector('#boot .scene-inner').getBoundingClientRect();

      /* v386.1 established the correct release geometry contract: a world-aligned
         Box3 around a rotated/deep CRT invents empty corners that are not occupied
         by the cabinet and can report false clipping. Sample the actual transformed
         GLB vertices here too, so this historical v364 interaction gate measures
         the same real silhouette as the current Hero gate. */
      let minX=Infinity,maxX=-Infinity,minY=Infinity,maxY=-Infinity,vertices=0;
      const p=new THREE.Vector3();
      i.model.traverse(node=>{
        if(!node.isMesh)return;
        const pos=node.geometry?.attributes?.position;if(!pos)return;
        for(let j=0;j<pos.count;j++){
          p.fromBufferAttribute(pos,j).applyMatrix4(node.matrixWorld).project(i.camera);
          if(!Number.isFinite(p.x)||!Number.isFinite(p.y))continue;
          minX=Math.min(minX,p.x);maxX=Math.max(maxX,p.x);minY=Math.min(minY,p.y);maxY=Math.max(maxY,p.y);vertices++;
        }
      });
      const bounds={
        left:r.x+(minX+1)*r.width/2,
        right:r.x+(maxX+1)*r.width/2,
        top:r.y+(1-maxY)*r.height/2,
        bottom:r.y+(1-minY)*r.height/2,
      };
      const projectedWidth=Math.max(1,bounds.right-bounds.left);
      const visibleWidth=Math.max(0,Math.min(bounds.right,scene.right)-Math.max(bounds.left,scene.left));
      const horizontalVisibleRatio=visibleWidth/projectedWidth;
      const verticalContained=bounds.top>=scene.top-8&&bounds.bottom<=scene.bottom+8;
      return {bounds,ndc:{minX,maxX,minY,maxY,vertices},scene:{left:scene.left,right:scene.right,top:scene.top,bottom:scene.bottom},verticalContained,horizontalVisibleRatio,visibleWidth,projectedWidth};
    });

    const initial=await snapshot();
    assert.equal(initial.triangles,44831);assert.equal(initial.canvases,1);assert.ok(initial.overflow<=2);assert.equal(initial.marker,'v364-ready');

    if(cfg.name==='desktop'){
      const p=await bodyPoint();assert.ok(p,'QA could not find a visible CRT cabinet surface');
      /* v378 upgrades the idle orbit affordance into a pickup affordance while a
         real body ray-hit is active. Both phrases describe the same v364 physical
         cabinet capability; which one is visible depends on pickup hover settling. */
      const physicalHint=/SEGURE.*ARRASTE.*TV|ARRASTE.*ORBITAR.*TV/i;
      await page.mouse.move(p.x,p.y,{steps:4});
      await page.waitForFunction(()=>document.querySelector('#boot')?.dataset.crtObjectHit==='body',null,{timeout:2500,polling:'raf'});
      const hoverState=await snapshot();
      assert.equal(hoverState.bodyHit,'body','physical object hover affordance is missing');
      assert.ok(physicalHint.test(hoverState.hint),`current physical object hint is missing: ${hoverState.hint}`);

      const before=await snapshot();
      await page.mouse.down();await page.mouse.move(p.x+112,p.y-34,{steps:8});
      await page.waitForFunction(()=>document.querySelector('#boot')?.dataset.crtGrab==='dragging',null,{timeout:2500,polling:'raf'});
      await page.mouse.up();await page.waitForTimeout(180);
      const after=await snapshot();
      assert.ok(after.bodyDrags>before.bodyDrags,'dragging the cabinet must manipulate the actual 3D object');
      assert.equal(after.lastAction,'object-orbit');assert.notEqual(after.yaw,before.yaw);assert.notEqual(after.pitch,before.pitch);
      assert.equal(after.channel,before.channel,'cabinet orbit must not change channel');assert.equal(after.art,before.art,'cabinet orbit must not trigger screen artwork');
      assert.ok(physicalHint.test(after.hint),`physical object affordance disappeared after manipulation: ${after.hint}`);
      assert.ok(['inertia','idle'].includes(after.grab),'cabinet did not leave direct drag through the physical grab state');

      await page.evaluate(()=>scrollTo(0,Math.max(1,(document.querySelector('#boot').offsetHeight-innerHeight)*.48)));
      await page.waitForTimeout(850);
      const fit=await framing();
      /* v369/v374 intentionally let the volumetric rear/side of the rotated CRT
         breathe into the full-bleed edge. The physical contract is therefore:
         keep the complete real vertical cabinet silhouette framed, keep a strong
         majority visible horizontally, and retain a ray-hittable cabinet surface. */
      assert.ok(fit.ndc.vertices>1000,`CRT silhouette gate sampled too few vertices: ${JSON.stringify(fit)}`);
      assert.equal(fit.verticalContained,true,`CRT must remain vertically framed during Scene 01 choreography: ${JSON.stringify(fit)}`);
      assert.ok(fit.horizontalVisibleRatio>=.82,`CRT became materially cropped during Scene 01 choreography: ${JSON.stringify(fit)}`);
      const midPoint=await bodyPoint();assert.ok(midPoint,'CRT lost its ray-hittable cabinet surface during Scene 01 choreography');
      await page.evaluate(()=>scrollTo(0,0));await page.waitForTimeout(300);
    }

    if(cfg.name==='mobile'){
      const before=await snapshot();
      assert.equal(before.bodyDrags,0,'mobile must not auto-capture cabinet gestures');
      await page.locator('[data-crt-mode-control="direction"]').click();
      await page.locator('.crt-program-controls button').first().click();
      await page.waitForFunction(a=>window.MOVX3D.runtime.instances['boot-tv'].channels.state.art!==a,before.art,{timeout:5000});
      const hintDisplay=await page.locator('.crt-object-hint').evaluate(el=>getComputedStyle(el).display);
      assert.equal(hintDisplay,'none','desktop orbit hint must stay hidden on touch layouts');
    }

    if(cfg.name==='reduced'){
      const p=await bodyPoint();assert.ok(p,'reduced-motion QA could not find CRT cabinet');
      const before=await snapshot();
      await page.mouse.move(p.x,p.y);await page.mouse.down();await page.mouse.move(p.x+82,p.y+20,{steps:6});await page.mouse.up();await page.waitForTimeout(140);
      const after=await snapshot();assert.ok(after.bodyDrags>before.bodyDrags);assert.notEqual(after.yaw,before.yaw,'reduced motion must retain manual object manipulation');
    }

    assert.deepEqual(errors,[]);
    await page.locator('#boot').screenshot({path:`_site/qa-v364-${cfg.name}-object.png`});
    results.push({name:cfg.name,status:'PASS',state:await snapshot(),framing:cfg.name==='desktop'?await framing():null});
    await page.close();
  }
  await browser.close();fs.writeFileSync('_site/qa-v364-results.json',JSON.stringify(results,null,2));
  console.log(JSON.stringify(results.map(r=>({name:r.name,status:r.status,bodyDrags:r.state.bodyDrags,lastAction:r.state.lastAction,yaw:r.state.yaw,pitch:r.state.pitch}))));
})().catch(e=>{console.error(e);process.exit(1)});
