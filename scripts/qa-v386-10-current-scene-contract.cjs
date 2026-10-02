const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');

(async()=>{
  const models=fs.readdirSync('_site/models').filter(x=>x.endsWith('.glb')).sort();
  assert.deepEqual(models,['movx-crt-tv.glb'],'v386.10 must keep one production GLB');
  const browser=await chromium.launch({headless:true,args:['--no-sandbox','--use-angle=swiftshader','--enable-webgl','--ignore-gpu-blocklist']});
  try{
    const page=await browser.newPage({viewport:{width:1440,height:1000},deviceScaleFactor:1});
    const errors=[];page.on('pageerror',e=>errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
    await page.goto(process.env.MOVX_TEST_URL||'http://127.0.0.1:4174/',{waitUntil:'domcontentloaded',timeout:30000});
    await page.waitForFunction(()=>document.querySelector('[data-model-slot="boot-tv"]')?.dataset.glbState==='ready',null,{timeout:25000});
    await page.waitForFunction(()=>document.documentElement.dataset.crtChannelClickSurface==='v386.10-scene-field',null,{timeout:8000});
    await page.waitForFunction(()=>window.MOVX3D?.runtime?.instances?.['boot-tv']?.objectVolume?.state&&window.MOVX3D?.runtime?.instances?.['boot-tv']?.scenePresence?.state,null,{timeout:12000});

    const state=()=>page.evaluate(()=>{
      const root=document.documentElement,i=window.MOVX3D.runtime.instances['boot-tv'];
      return {
        channel:i.channels.state.channel,art:i.channels.state.art,pixels:i.channels.canvas.toDataURL(),
        yaw:i.group.rotation.y,sceneX:i.scenePresence.state.x,sceneMix:i.scenePresence.state.mix,
        pointerYaw:i.objectVolume.state.pointerYaw,triangles:i.stats.triangles,
        renderers:document.querySelectorAll('.v322-model-renderer').length,
        activeSlots:window.MOVX3D.runtime.activeSlots,overflow:root.scrollWidth-innerWidth,
        clickSurface:root.dataset.crtChannelClickSurface,inputSurface:root.dataset.crtInputSurface,
      };
    });
    const choose=async ch=>{
      await page.locator(`[data-crt-mode-control="${ch}"]`).click();
      await page.waitForFunction(c=>window.MOVX3D.runtime.instances['boot-tv'].channels.state.channel===c,ch,{timeout:7000,polling:'raf'});
    };
    const stableScreenPoint=async()=>{
      let last=null;
      for(let attempt=0;attempt<6;attempt++){
        const p=await page.evaluate(async()=>{
          const THREE=await import('./vendor/three.module.js');
          const i=window.MOVX3D.runtime.instances['boot-tv'],screen=i.channels.screen,r=i.canvas.getBoundingClientRect();
          screen.geometry.computeBoundingBox();const c=screen.geometry.boundingBox.getCenter(new THREE.Vector3());screen.localToWorld(c);c.project(i.camera);
          const center={x:r.x+(c.x+1)*r.width/2,y:r.y+(1-c.y)*r.height/2};
          const ray=new THREE.Raycaster(),ndc=new THREE.Vector2();
          for(const dy of [0,-6,6,-12,12,-18,18,-24,24])for(const dx of [0,-8,8,-16,16,-24,24]){
            const x=center.x+dx,y=center.y+dy;ndc.set((x-r.x)/r.width*2-1,-(y-r.y)/r.height*2+1);ray.setFromCamera(ndc,i.camera);
            if(ray.intersectObject(i.model,true)[0]?.object===screen)return{x,y,visible:true};
          }
          return {...center,visible:false};
        });
        assert.equal(p.visible,true,'real CRT screen is not visibly ray-hittable');
        last=p;await page.mouse.move(p.x,p.y,{steps:4});await page.waitForTimeout(150);
        const still=await page.evaluate(async p=>{
          const THREE=await import('./vendor/three.module.js');const i=window.MOVX3D.runtime.instances['boot-tv'],r=i.canvas.getBoundingClientRect();
          const ray=new THREE.Raycaster(),ndc=new THREE.Vector2((p.x-r.x)/r.width*2-1,-(p.y-r.y)/r.height*2+1);ray.setFromCamera(ndc,i.camera);
          return ray.intersectObject(i.model,true)[0]?.object===i.channels.screen;
        },p);
        if(still)return p;
      }
      assert.fail('screen point never stabilized under live Scene-01 parallax: '+JSON.stringify(last));
    };

    await choose('direction');
    const before=await state(),point=await stableScreenPoint();
    await page.mouse.click(point.x,point.y);
    await page.waitForFunction(previous=>{
      const i=window.MOVX3D.runtime.instances['boot-tv'];return i.channels.state.art!==previous.art&&i.channels.canvas.toDataURL()!==previous.pixels;
    },before,{timeout:7000,polling:'raf'});
    const clicked=await state();
    assert.notEqual(clicked.art,before.art,'click on visible real screen did not advance artwork');
    assert.notEqual(clicked.pixels,before.pixels,'real screen texture did not update after click');

    const scene=page.locator('#boot .scene-inner'),box=await scene.boundingBox();assert.ok(box&&box.width>700&&box.height>500);
    const settlePointer=async(fx,sign)=>{
      await page.mouse.move(box.x+box.width*fx,box.y+box.height*.30,{steps:14});
      await page.waitForFunction(sign=>{
        const i=window.MOVX3D.runtime.instances['boot-tv'],s=i.scenePresence.state,v=i.objectVolume.state;
        return s.mix>.72 && (sign<0?s.x<-.55:s.x>.55) && (sign<0?v.pointerYaw<-.015:v.pointerYaw>.015);
      },sign,{timeout:8000,polling:'raf'});
      const values=[];
      for(let n=0;n<5;n++){await page.waitForTimeout(90);values.push(await page.evaluate(()=>window.MOVX3D.runtime.instances['boot-tv'].group.rotation.y));}
      const snap=await state();snap.meanYaw=values.reduce((a,b)=>a+b,0)/values.length;snap.samples=values;return snap;
    };
    const left=await settlePointer(.08,-1);
    const right=await settlePointer(.92,1);
    assert.ok(left.pointerYaw<-.015&&right.pointerYaw>.015,'v371 object-volume did not inherit scene-wide pointer intent');
    assert.ok(right.meanYaw-left.meanYaw>.035,`real CRT group did not visibly respond across Scene-01 pointer field: ${left.meanYaw} -> ${right.meanYaw}`);

    for(const snap of [clicked,left,right]){
      assert.equal(snap.triangles,44831);assert.equal(snap.renderers,1);assert.deepEqual(snap.activeSlots,['boot-tv']);assert.ok(snap.overflow<=2);
      assert.equal(snap.clickSurface,'v386.10-scene-field');assert.equal(snap.inputSurface,'v386.9-scene-field');
    }
    assert.deepEqual(errors,[],'page errors: '+errors.join(' | '));
    await page.locator('#boot').screenshot({path:'_site/qa-v386-10-current-scene.png'});
    fs.writeFileSync('_site/qa-v386-10-current-scene.json',JSON.stringify({before,clicked,left,right},null,2));
    console.log(JSON.stringify({qa:'v386.10-current-scene-contract',status:'PASS',screenClick:{before:before.art,after:clicked.art},pointerVolume:{left:left.meanYaw,right:right.meanYaw,delta:right.meanYaw-left.meanYaw}}));
    await page.close();
  } finally {await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
