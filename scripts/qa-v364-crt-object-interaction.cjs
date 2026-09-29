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
      const box=new THREE.Box3().setFromObject(i.model),min=box.min,max=box.max;
      const corners=[];for(const x of [min.x,max.x])for(const y of [min.y,max.y])for(const z of [min.z,max.z])corners.push(new THREE.Vector3(x,y,z));
      const r=i.canvas.getBoundingClientRect(),scene=document.querySelector('#boot .scene-inner').getBoundingClientRect();
      const projected=corners.map(v=>{v.project(i.camera);return{x:r.x+(v.x+1)*r.width/2,y:r.y+(1-v.y)*r.height/2}});
      const bounds={left:Math.min(...projected.map(p=>p.x)),right:Math.max(...projected.map(p=>p.x)),top:Math.min(...projected.map(p=>p.y)),bottom:Math.max(...projected.map(p=>p.y))};
      return {bounds,scene:{left:scene.left,right:scene.right,top:scene.top,bottom:scene.bottom},contained:bounds.left>=scene.left-8&&bounds.right<=scene.right+8&&bounds.top>=scene.top-8&&bounds.bottom<=scene.bottom+8};
    });

    const initial=await snapshot();
    assert.equal(initial.triangles,44831);assert.equal(initial.canvases,1);assert.ok(initial.overflow<=2);assert.equal(initial.marker,'v364-ready');

    if(cfg.name==='desktop'){
      const p=await bodyPoint();assert.ok(p,'QA could not find a visible CRT cabinet surface');
      const before=await snapshot();
      await page.mouse.move(p.x,p.y);await page.mouse.down();await page.mouse.move(p.x+112,p.y-34,{steps:8});await page.mouse.up();await page.waitForTimeout(180);
      const after=await snapshot();
      assert.ok(after.bodyDrags>before.bodyDrags,'dragging the cabinet must manipulate the actual 3D object');
      assert.equal(after.lastAction,'object-orbit');assert.notEqual(after.yaw,before.yaw);assert.notEqual(after.pitch,before.pitch);
      assert.equal(after.channel,before.channel,'cabinet orbit must not change channel');assert.equal(after.art,before.art,'cabinet orbit must not trigger screen artwork');
      assert.ok(after.hint.includes('ARRASTE A TV'),'physical object affordance is missing');

      await page.evaluate(()=>scrollTo(0,Math.max(1,(document.querySelector('#boot').offsetHeight-innerHeight)*.48)));
      await page.waitForTimeout(850);
      const fit=await framing();assert.ok(fit.contained,`full CRT must remain framed during Scene 01 choreography: ${JSON.stringify(fit)}`);
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
