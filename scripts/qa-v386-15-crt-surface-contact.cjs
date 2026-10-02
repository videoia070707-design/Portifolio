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

    const points=await page.evaluate(async()=>{
      const THREE=await import('./vendor/three.module.js');
      const i=window.MOVX3D.runtime.instances['boot-tv'];
      const r=i.canvas.getBoundingClientRect();
      const ray=new THREE.Raycaster(),ndc=new THREE.Vector2();
      const project=obj=>{obj.geometry.computeBoundingBox();const c=obj.geometry.boundingBox.getCenter(new THREE.Vector3());obj.localToWorld(c);c.project(i.camera);return{x:r.x+(c.x+1)*r.width/2,y:r.y+(1-c.y)*r.height/2}};
      const visiblePoint=(obj,center)=>{
        const offsets=[0,-6,6,-12,12,-18,18,-24,24,-32,32];
        for(const dy of offsets){for(const dx of offsets){
          const x=center.x+dx,y=center.y+dy;
          ndc.set((x-r.x)/r.width*2-1,-(y-r.y)/r.height*2+1);ray.setFromCamera(ndc,i.camera);
          const hit=ray.intersectObject(i.model,true)[0]?.object||null;
          if(hit===obj)return{x,y,name:obj.name};
        }}return null;
      };
      const screen=i.channels.screen,knob=i.model.getObjectByName('tripo_part_8');
      const sp=visiblePoint(screen,project(screen)),kp=visiblePoint(knob,project(knob));
      let bp=null;
      for(const obj of i.model.children.flatMap(()=>[])){}
      const meshes=[];i.model.traverse(o=>{if(o.isMesh&&o!==screen&&o!==knob)meshes.push(o)});
      for(const obj of meshes){const p=visiblePoint(obj,project(obj));if(p){bp=p;break}}
      return {screen:sp,knob:kp,body:bp};
    });
    assert.ok(points.screen&&points.knob&&points.body,'could not resolve visible CRT surface points: '+JSON.stringify(points));

    const moveAndRead=async(point,kind,label)=>{
      await page.mouse.move(point.x,point.y,{steps:10});
      await page.waitForFunction(({kind,label})=>{
        const i=window.MOVX3D.runtime.instances['boot-tv'];
        const hint=document.querySelector('#boot .crt-object-hint span')?.textContent||'';
        return i.surfaceContact?.state?.surface===kind&&i.surfaceContact.state.mix>.22&&hint.includes(label);
      },{kind,label},{timeout:6000,polling:'raf'});
      return await page.evaluate(()=>{const root=document.documentElement,boot=document.querySelector('#boot'),i=window.MOVX3D.runtime.instances['boot-tv'],s=i.surfaceContact.state;return{surface:s.surface,mix:s.mix,depth:s.depth,yaw:s.yaw,lightX:s.lightX,marker:boot.dataset.v386Contact,hint:boot.querySelector('.crt-object-hint span')?.textContent||'',renderers:document.querySelectorAll('.v322-model-renderer').length,canvases:document.querySelectorAll('.v322-model-renderer canvas').length,activeSlots:window.MOVX3D.runtime.activeSlots,overflow:root.scrollWidth-innerWidth}});
    };

    const screen=await moveAndRead(points.screen,'screen','TELA');
    const dial=await moveAndRead(points.knob,'dial','DIAL');
    const body=await moveAndRead(points.body,'body','TV');
    for(const s of [screen,dial,body]){assert.equal(s.renderers,1);assert.equal(s.canvases,1);assert.deepEqual(s.activeSlots,['boot-tv']);assert.ok(s.overflow<=2)}
    assert.ok(screen.depth>.002,'screen contact did not create visible depth acknowledgement');
    assert.ok(body.depth>.004,'body contact did not create visible depth acknowledgement');
    assert.equal(screen.marker,'screen');assert.equal(dial.marker,'dial');assert.equal(body.marker,'body');
    assert.equal(errors.length,0,'page errors: '+errors.join(' | '));
    await page.locator('#boot').screenshot({path:'_site/qa-v386-15-surface-contact.png'});
    fs.writeFileSync('_site/qa-v386-15-surface-contact.json',JSON.stringify({points,screen,dial,body},null,2));
    console.log(JSON.stringify({qa:'v386.15-surface-contact',status:'PASS',screen,dial,body}));
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
