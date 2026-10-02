const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');

(async()=>{
  const models=fs.readdirSync('_site/models').filter(x=>x.endsWith('.glb')).sort();
  assert.deepEqual(models,['movx-crt-tv.glb']);
  const browser=await chromium.launch({headless:true,args:['--no-sandbox','--use-angle=swiftshader','--enable-webgl','--ignore-gpu-blocklist']});
  try{
    const page=await browser.newPage({viewport:{width:1440,height:1000},deviceScaleFactor:1});
    const errors=[];page.on('pageerror',e=>errors.push(String(e)));
    await page.goto('http://127.0.0.1:4173/',{waitUntil:'domcontentloaded',timeout:30000});
    await page.waitForFunction(()=>document.querySelector('[data-model-slot="boot-tv"]')?.dataset.glbState==='ready',null,{timeout:25000});
    await page.waitForFunction(()=>document.documentElement.dataset.crtSurfaceContact==='v386.15-ready',null,{timeout:12000});
    await page.waitForFunction(()=>Number(document.querySelector('#boot')?.dataset.v386ContactFrame||0)>8,null,{timeout:5000,polling:'raf'});

    /* v386.17 QA: the CRT is no longer a static product viewer. Approaching a
       surface changes the real group, camera and light field, so a point projected
       once at page load can become stale before the contact layer settles. Resolve
       every surface from the CURRENT transformed GLB, approach it, then reproject
       until the same Three.js surface remains under the cursor. The runtime is not
       mocked and no interaction threshold is weakened. */
    const resolvePoint=kind=>page.evaluate(async kind=>{
      const THREE=await import('./vendor/three.module.js');
      const i=window.MOVX3D.runtime.instances['boot-tv'];
      const r=i.canvas.getBoundingClientRect();
      const ray=new THREE.Raycaster(),ndc=new THREE.Vector2();
      const screen=i.channels.screen,knob=i.model.getObjectByName('tripo_part_8');
      const project=obj=>{
        obj.geometry.computeBoundingBox();
        const c=obj.geometry.boundingBox.getCenter(new THREE.Vector3());
        obj.localToWorld(c);c.project(i.camera);
        return{x:r.x+(c.x+1)*r.width/2,y:r.y+(1-c.y)*r.height/2};
      };
      const visiblePoint=(obj,center)=>{
        const rings=[0,5,9,14,20,27,35,44];
        const offsets=[];
        for(const radius of rings){
          if(radius===0){offsets.push([0,0]);continue}
          offsets.push([radius,0],[-radius,0],[0,radius],[0,-radius],[radius*.7,radius*.7],[-radius*.7,radius*.7],[radius*.7,-radius*.7],[-radius*.7,-radius*.7]);
        }
        for(const [dx,dy] of offsets){
          const x=center.x+dx,y=center.y+dy;
          if(x<r.left+2||x>r.right-2||y<r.top+2||y>r.bottom-2)continue;
          ndc.set((x-r.x)/r.width*2-1,-(y-r.y)/r.height*2+1);
          ray.setFromCamera(ndc,i.camera);
          const hit=ray.intersectObject(i.model,true)[0]?.object||null;
          if(hit===obj)return{x,y,name:obj.name,hit:hit.name};
        }
        return null;
      };
      if(kind==='screen')return visiblePoint(screen,project(screen));
      if(kind==='dial')return visiblePoint(knob,project(knob));
      const meshes=[];i.model.traverse(o=>{if(o.isMesh&&o!==screen&&o!==knob)meshes.push(o)});
      // Prefer larger cabinet meshes so the body gate does not accidentally lock
      // onto a tiny trim piece that immediately moves behind another surface.
      meshes.forEach(o=>{o.geometry.computeBoundingBox();const s=o.geometry.boundingBox.getSize(new THREE.Vector3());o.userData.__v386Area=s.x*s.y+s.x*s.z+s.y*s.z});
      meshes.sort((a,b)=>(b.userData.__v386Area||0)-(a.userData.__v386Area||0));
      for(const obj of meshes){const p=visiblePoint(obj,project(obj));if(p)return p}
      return null;
    },kind);

    const readContact=()=>page.evaluate(()=>{
      const root=document.documentElement,boot=document.querySelector('#boot'),i=window.MOVX3D.runtime.instances['boot-tv'],s=i.surfaceContact.state;
      return{
        surface:s.surface,mix:s.mix,depth:s.depth,yaw:s.yaw,lightX:s.lightX,
        physicalSurface:i.presence.state.lastSurface,
        hoverMix:i.presence.state.hoverMix,
        marker:boot.dataset.v386Contact,
        hint:boot.querySelector('.crt-object-hint span')?.textContent||'',
        renderers:document.querySelectorAll('.v322-model-renderer').length,
        canvases:document.querySelectorAll('.v322-model-renderer canvas').length,
        activeSlots:window.MOVX3D.runtime.activeSlots,
        overflow:root.scrollWidth-innerWidth
      };
    });

    const settleSurface=async(kind,label)=>{
      // Clear the previous physical hit while staying inside Scene 01. This keeps
      // scene-wide cinematic parallax alive but forces object-specific raycast
      // presence to reacquire the requested real surface.
      await page.mouse.move(1360,120,{steps:5});
      await page.waitForTimeout(120);
      let lastPoint=null,lastState=null;
      for(let attempt=0;attempt<7;attempt++){
        const point=await resolvePoint(kind);
        assert.ok(point,`could not resolve current ${kind} point on attempt ${attempt+1}`);
        lastPoint=point;
        await page.mouse.move(point.x,point.y,{steps:attempt===0?10:5});
        await page.waitForTimeout(150);
        lastState=await readContact();
        if(lastState.surface===kind&&lastState.mix>.22&&lastState.hint.includes(label)){
          return{point,state:lastState,attempts:attempt+1};
        }
      }
      // One final bounded convergence wait on the last reprojected point. If the
      // actual raycast/contact contract is broken, this still fails hard.
      await page.waitForFunction(({kind,label})=>{
        const i=window.MOVX3D.runtime.instances['boot-tv'];
        const hint=document.querySelector('#boot .crt-object-hint span')?.textContent||'';
        return i.surfaceContact?.state?.surface===kind&&i.surfaceContact.state.mix>.22&&hint.includes(label);
      },{kind,label},{timeout:4500,polling:'raf'});
      return{point:lastPoint,state:await readContact(),attempts:8};
    };

    const screenResult=await settleSurface('screen','TELA');
    const dialResult=await settleSurface('dial','DIAL');
    const bodyResult=await settleSurface('body','TV');
    const screen=screenResult.state,dial=dialResult.state,body=bodyResult.state;
    for(const s of [screen,dial,body]){assert.equal(s.renderers,1);assert.equal(s.canvases,1);assert.deepEqual(s.activeSlots,['boot-tv']);assert.ok(s.overflow<=2)}
    assert.ok(screen.depth>.002,'screen contact did not create visible depth acknowledgement');
    assert.ok(body.depth>.004,'body contact did not create visible depth acknowledgement');
    assert.equal(screen.marker,'screen');assert.equal(dial.marker,'dial');assert.equal(body.marker,'body');
    assert.notEqual(screen.physicalSurface,'none','screen semantic contact has no underlying Three.js hit');
    assert.notEqual(dial.physicalSurface,'none','dial semantic contact has no underlying Three.js hit');
    assert.notEqual(body.physicalSurface,'none','body semantic contact has no underlying Three.js hit');
    assert.equal(errors.length,0,'page errors: '+errors.join(' | '));
    await page.locator('#boot').screenshot({path:'_site/qa-v386-15-surface-contact.png'});
    fs.writeFileSync('_site/qa-v386-15-surface-contact.json',JSON.stringify({screenResult,dialResult,bodyResult},null,2));
    console.log(JSON.stringify({qa:'v386.17-stable-surface-contact',status:'PASS',screen:screenResult,dial:dialResult,body:bodyResult}));
    await page.close();

    const reduced=await browser.newPage({viewport:{width:1280,height:800},reducedMotion:'reduce'});
    await reduced.goto('http://127.0.0.1:4173/',{waitUntil:'domcontentloaded',timeout:30000});
    await reduced.waitForFunction(()=>document.querySelector('[data-model-slot="boot-tv"]')?.dataset.glbState==='ready',null,{timeout:25000});
    await reduced.waitForFunction(()=>document.documentElement.dataset.crtSurfaceContact==='v386.15-ready',null,{timeout:12000});
    const reducedState=await reduced.evaluate(()=>{const i=window.MOVX3D.runtime.instances['boot-tv'];return{reduced:i.surfaceContact.state.reduced,mix:i.surfaceContact.state.mix,press:i.surfaceContact.state.press,renderers:document.querySelectorAll('.v322-model-renderer').length,activeSlots:window.MOVX3D.runtime.activeSlots}});
    assert.equal(reducedState.reduced,true);assert.equal(reducedState.mix,0);assert.equal(reducedState.press,0);assert.equal(reducedState.renderers,1);assert.deepEqual(reducedState.activeSlots,['boot-tv']);
    await reduced.close();
  } finally {await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
