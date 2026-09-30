const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');

(async()=>{
  const models=fs.readdirSync('_site/models').filter(x=>x.toLowerCase().endsWith('.glb')).sort();
  assert.deepEqual(models,['movx-crt-tv.glb'],'v374 must keep exactly one production GLB');

  const browser=await chromium.launch({headless:true,args:['--no-sandbox','--use-angle=swiftshader','--enable-webgl','--ignore-gpu-blocklist']});
  try{
    const page=await browser.newPage({viewport:{width:1440,height:1000},deviceScaleFactor:1});
    const errors=[];page.on('pageerror',e=>errors.push(String(e)));
    await page.goto('http://127.0.0.1:4173/',{waitUntil:'domcontentloaded',timeout:30000});
    await page.waitForFunction(()=>document.documentElement.dataset.crtScenePresence==='v368-ready',null,{timeout:20000});
    await page.waitForFunction(()=>document.querySelector('[data-model-slot="boot-tv"]')?.dataset.glbState==='ready',null,{timeout:20000});
    await page.waitForFunction(()=>document.documentElement.dataset.motionIntro==='ready',null,{timeout:12000});
    await page.waitForFunction(()=>{const i=document.querySelector('#boot .scene-inner')?.getBoundingClientRect(),b=document.querySelector('#boot .scene-bar')?.getBoundingClientRect();return !!i&&!!b&&Math.abs(b.top-i.top)<=2},null,{timeout:5000,polling:'raf'});

    const desktop=await page.evaluate(()=>{
      const root=document.documentElement;
      const boot=document.querySelector('#boot');
      const inner=boot.querySelector('.scene-inner');
      const bar=boot.querySelector('.scene-bar');
      const stage=boot.querySelector('.boot-stage');
      const panel=boot.querySelector('#crt-channel-panel');
      const hero=document.querySelector('#hero');
      const heroInner=hero.querySelector('.scene-inner');
      const b=boot.getBoundingClientRect(),i=inner.getBoundingClientRect(),s=stage.getBoundingClientRect(),p=panel.getBoundingClientRect(),h=heroInner.getBoundingClientRect();
      const is=getComputedStyle(inner),bs=getComputedStyle(boot),bars=getComputedStyle(bar),hs=getComputedStyle(heroInner),ss=getComputedStyle(stage);
      const r=window.MOVX3D.runtime;
      return {
        layer:root.dataset.crtSceneFrameLayer,
        safeFraming:root.dataset.crtSafeFramingLayer,
        bootPaddingTop:bs.paddingTop,
        inner:{left:i.left,right:i.right,top:i.top,width:i.width,height:i.height,position:is.position,topStyle:is.top,borderRadius:is.borderRadius,borderTopWidth:is.borderTopWidth},
        bar:{position:bars.position,top:bar.getBoundingClientRect().top,height:bar.getBoundingClientRect().height,borderBottom:bars.borderBottomWidth},
        stage:{top:s.top,height:s.height,paddingTop:ss.paddingTop,paddingLeft:ss.paddingLeft},
        panelInside:p.bottom<=i.bottom+1,
        hero:{left:h.left,right:h.right,borderRadius:hs.borderRadius,borderTopWidth:hs.borderTopWidth},
        viewport:{width:innerWidth,height:innerHeight},
        renderers:document.querySelectorAll('.v322-model-renderer').length,
        activeSlots:r.activeSlots,
        deferred:r.deferredSlots,
        triangles:r.instances['boot-tv'].stats.triangles,
        scenePresence:root.dataset.crtScenePresence,
        director:root.dataset.crtDirector,
        overflow:root.scrollWidth-innerWidth,
        errors:r.errors,
        bootHeight:b.height,
      };
    });
    assert.equal(desktop.layer,'v369-full-bleed');
    assert.equal(desktop.safeFraming,'v374-short-viewport');
    assert.equal(desktop.bootPaddingTop,'58px');
    assert.ok(Math.abs(desktop.inner.left)<=1 && Math.abs(desktop.inner.right-desktop.viewport.width)<=1,`Scene 01 is not full bleed: ${JSON.stringify(desktop.inner)}`);
    assert.equal(desktop.inner.borderRadius,'0px');
    assert.equal(desktop.inner.borderTopWidth,'0px');
    assert.equal(desktop.inner.position,'sticky');
    assert.equal(desktop.inner.topStyle,'58px');
    assert.ok(Math.abs(desktop.inner.height-(desktop.viewport.height-58))<=2,`Scene 01 viewport height mismatch: ${desktop.inner.height}`);
    assert.equal(desktop.bar.position,'absolute','Scene-01 metadata must overlay the world on desktop');
    assert.ok(Math.abs(desktop.bar.top-desktop.inner.top)<=2);
    assert.equal(desktop.bar.borderBottom,'0px');
    assert.ok(desktop.stage.height>=desktop.inner.height-2,'boot-stage does not own the full spatial viewport');
    assert.equal(desktop.panelInside,true,'channel deck escaped the full-bleed Scene 01 viewport');
    assert.ok(desktop.hero.left>=7 && desktop.hero.right<=desktop.viewport.width-7,'v369 leaked full-bleed framing into Scene 02');
    assert.notEqual(desktop.hero.borderRadius,'0px','Scene 02 card radius was modified by v369');
    assert.equal(desktop.renderers,1);
    assert.deepEqual(desktop.activeSlots,['boot-tv']);
    assert.ok(desktop.deferred.includes('hero-movx-logo')&&desktop.deferred.includes('x-portal'));
    assert.equal(desktop.triangles,44831);
    assert.equal(desktop.scenePresence,'v368-ready');
    assert.equal(desktop.director,'v367-ready');
    assert.ok(desktop.overflow<=2);
    assert.equal(desktop.errors.length,0);
    assert.equal(errors.length,0,'desktop page errors: '+errors.join(' | '));
    await page.screenshot({path:'_site/qa-v369-scene01-full-bleed-desktop.png',fullPage:false});
    console.log(JSON.stringify({qa:'v374-scene01-safe-framing',viewport:'desktop',status:'PASS',desktop}));
    await page.close();

    const shortPage=await browser.newPage({viewport:{width:1280,height:720},deviceScaleFactor:1});
    const shortErrors=[];shortPage.on('pageerror',e=>shortErrors.push(String(e)));
    await shortPage.goto('http://127.0.0.1:4173/',{waitUntil:'domcontentloaded',timeout:30000});
    await shortPage.waitForFunction(()=>document.querySelector('[data-model-slot="boot-tv"]')?.dataset.glbState==='ready',null,{timeout:20000});
    await shortPage.waitForFunction(()=>document.documentElement.dataset.motionIntro==='ready',null,{timeout:12000});
    await shortPage.waitForFunction(()=>Number(document.querySelector('#boot')?.dataset.v371Frame||0)>8,null,{timeout:7000,polling:'raf'});
    const shortState=await shortPage.evaluate(async()=>{
      const THREE=await import('./vendor/three.module.js');
      const root=document.documentElement,boot=document.querySelector('#boot');
      const scene=boot.querySelector('.scene-inner').getBoundingClientRect();
      const panel=boot.querySelector('#crt-channel-panel').getBoundingClientRect();
      const wrap=boot.querySelector('.crt-wrap');
      const wrapRect=wrap.getBoundingClientRect(),wrapStyle=getComputedStyle(wrap);
      const i=window.MOVX3D.runtime.instances['boot-tv'];
      i.group.updateMatrixWorld(true);i.camera.updateMatrixWorld(true);
      const canvas=i.canvas.getBoundingClientRect();
      const worldBox=new THREE.Box3().setFromObject(i.model);
      const min=worldBox.min,max=worldBox.max;
      const corners=[];
      for(const x of [min.x,max.x])for(const y of [min.y,max.y])for(const z of [min.z,max.z]){
        const v=new THREE.Vector3(x,y,z).project(i.camera);
        corners.push({x:canvas.x+(v.x+1)*canvas.width/2,y:canvas.y+(1-v.y)*canvas.height/2});
      }
      const model={
        left:Math.min(...corners.map(p=>p.x)),right:Math.max(...corners.map(p=>p.x)),
        top:Math.min(...corners.map(p=>p.y)),bottom:Math.max(...corners.map(p=>p.y)),
      };
      model.width=model.right-model.left;model.height=model.bottom-model.top;
      const knob=i.model.getObjectByName('tripo_part_8');
      knob.geometry.computeBoundingBox();const kc=knob.geometry.boundingBox.getCenter(new THREE.Vector3());knob.localToWorld(kc);kc.project(i.camera);
      const center={x:canvas.x+(kc.x+1)*canvas.width/2,y:canvas.y+(1-kc.y)*canvas.height/2};
      const ray=new THREE.Raycaster(),ndc=new THREE.Vector2(),offsets=[0,-4,4,-8,8,-12,12,-18,18,-24,24,-32,32,-40,40];
      let selector={...center,visible:false};
      outer:for(const dy of offsets)for(const dx of offsets){
        const x=center.x+dx,y=center.y+dy;
        if(x<0||x>innerWidth||y<0||y>innerHeight)continue;
        ndc.set((x-canvas.x)/canvas.width*2-1,-(y-canvas.y)/canvas.height*2+1);ray.setFromCamera(ndc,i.camera);
        if(ray.intersectObject(i.model,true)[0]?.object===knob){selector={x,y,visible:true};break outer;}
      }
      return {
        safeFraming:root.dataset.crtSafeFramingLayer,
        sceneLeft:scene.left,sceneRight:scene.right,sceneTop:scene.top,sceneBottom:scene.bottom,
        panelInside:panel.bottom<=scene.bottom+1,
        wrap:{top:wrapRect.top,bottom:wrapRect.bottom,cssTop:wrapStyle.top},
        model,selector,selectorCenter:center,
        viewport:{width:innerWidth,height:innerHeight},
        overflow:root.scrollWidth-innerWidth,
        renderers:document.querySelectorAll('.v322-model-renderer').length,
        activeSlots:window.MOVX3D.runtime.activeSlots,
        triangles:i.stats.triangles,
        errors:window.MOVX3D.runtime.errors,
      };
    });
    assert.equal(shortState.safeFraming,'v374-short-viewport');
    assert.ok(Math.abs(shortState.sceneLeft)<=1&&Math.abs(shortState.sceneRight-1280)<=1);
    assert.equal(shortState.panelInside,true,'short-laptop channel deck is clipped');
    assert.ok(parseFloat(shortState.wrap.cssTop)<=-220,`v374 short framing offset did not engage at 720px: ${shortState.wrap.cssTop}`);
    assert.ok(shortState.model.top>=shortState.sceneTop+2,`real CRT top escaped the Scene-01 viewport: ${JSON.stringify(shortState.model)}`);
    assert.ok(shortState.model.bottom<=shortState.viewport.height-4,`real CRT cabinet is still cut below the short viewport: ${JSON.stringify(shortState.model)}`);
    assert.equal(shortState.selector.visible,true,`physical selector is not ray-hittable inside the viewport: ${JSON.stringify(shortState.selectorCenter)}`);
    assert.ok(shortState.selector.y>=shortState.sceneTop+20&&shortState.selector.y<=shortState.viewport.height-24,`physical selector is outside the short viewport safe area: ${JSON.stringify(shortState.selector)}`);
    assert.ok(shortState.overflow<=2);assert.equal(shortState.renderers,1);assert.deepEqual(shortState.activeSlots,['boot-tv']);assert.equal(shortState.triangles,44831);assert.equal(shortState.errors.length,0);assert.equal(shortErrors.length,0);
    await shortPage.screenshot({path:'_site/qa-v369-scene01-full-bleed-short.png',fullPage:false});
    console.log(JSON.stringify({qa:'v374-scene01-safe-framing',viewport:'short',status:'PASS',shortState}));
    await shortPage.close();

    const mobile=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:1});
    const mobileErrors=[];mobile.on('pageerror',e=>mobileErrors.push(String(e)));
    await mobile.goto('http://127.0.0.1:4173/',{waitUntil:'domcontentloaded',timeout:30000});
    await mobile.waitForFunction(()=>document.querySelector('[data-model-slot="boot-tv"]')?.dataset.glbState==='ready',null,{timeout:20000});
    const mobileState=await mobile.evaluate(()=>{
      const root=document.documentElement,boot=document.querySelector('#boot'),inner=boot.querySelector('.scene-inner'),bar=boot.querySelector('.scene-bar'),panel=boot.querySelector('#crt-channel-panel'),wrap=boot.querySelector('.crt-wrap');
      const i=inner.getBoundingClientRect(),p=panel.getBoundingClientRect();const is=getComputedStyle(inner),bars=getComputedStyle(bar),ws=getComputedStyle(wrap);
      return {left:i.left,right:i.right,borderRadius:is.borderRadius,position:is.position,barPosition:bars.position,noteDisplay:getComputedStyle(boot.querySelector('.scene-note')).display,panelInside:p.bottom<=i.bottom+1,wrapTop:ws.top,safeFraming:root.dataset.crtSafeFramingLayer,renderers:document.querySelectorAll('.v322-model-renderer').length,activeSlots:window.MOVX3D.runtime.activeSlots,sceneMix:window.MOVX3D.runtime.instances['boot-tv'].scenePresence.state.mix,overflow:root.scrollWidth-innerWidth,errors:window.MOVX3D.runtime.errors};
    });
    assert.equal(mobileState.safeFraming,'v374-short-viewport');
    const neutralTop=mobileState.wrapTop==='auto'||Math.abs(parseFloat(mobileState.wrapTop)||0)<=.5;
    assert.equal(neutralTop,true,`mobile CRT wrapper inherited a desktop safe-framing offset: ${mobileState.wrapTop}`);
    assert.ok(Math.abs(mobileState.left)<=1&&Math.abs(mobileState.right-390)<=1);
    assert.equal(mobileState.borderRadius,'0px');assert.equal(mobileState.position,'relative');assert.equal(mobileState.barPosition,'relative');assert.equal(mobileState.noteDisplay,'none');
    assert.equal(mobileState.panelInside,true);assert.equal(mobileState.renderers,1);assert.deepEqual(mobileState.activeSlots,['boot-tv']);assert.ok(mobileState.sceneMix<.01);assert.ok(mobileState.overflow<=2);assert.equal(mobileState.errors.length,0);assert.equal(mobileErrors.length,0);
    await mobile.screenshot({path:'_site/qa-v369-scene01-full-bleed-mobile.png',fullPage:false});
    console.log(JSON.stringify({qa:'v374-scene01-safe-framing',viewport:'mobile',status:'PASS',mobileState}));
    await mobile.close();

    const reduced=await browser.newPage({viewport:{width:1280,height:800},reducedMotion:'reduce'});
    await reduced.goto('http://127.0.0.1:4173/',{waitUntil:'domcontentloaded',timeout:30000});
    const reducedState=await reduced.evaluate(()=>{const root=document.documentElement,boot=document.querySelector('#boot'),inner=boot.querySelector('.scene-inner');const r=inner.getBoundingClientRect();return {reduced:matchMedia('(prefers-reduced-motion: reduce)').matches,left:r.left,right:r.right,position:getComputedStyle(inner).position,borderRadius:getComputedStyle(inner).borderRadius,bootHeight:boot.getBoundingClientRect().height,vh:innerHeight,safeFraming:root.dataset.crtSafeFramingLayer,overflow:root.scrollWidth-innerWidth}});
    assert.equal(reducedState.safeFraming,'v374-short-viewport');assert.equal(reducedState.reduced,true);assert.equal(reducedState.position,'relative');assert.equal(reducedState.borderRadius,'0px');assert.ok(Math.abs(reducedState.left)<=1&&Math.abs(reducedState.right-1280)<=1);assert.ok(reducedState.bootHeight<reducedState.vh*1.2);assert.ok(reducedState.overflow<=2);
    console.log(JSON.stringify({qa:'v374-scene01-safe-framing',viewport:'reduced',status:'PASS',reducedState}));
    await reduced.close();
  } finally {await browser.close()}
})().catch(err=>{console.error(err);process.exit(1)});
