const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');

(async()=>{
  const models=fs.readdirSync('_site/models').filter(x=>x.toLowerCase().endsWith('.glb')).sort();
  assert.deepEqual(models,['movx-crt-tv.glb'],'v372 must keep exactly one production GLB');

  const browser=await chromium.launch({headless:true,args:['--no-sandbox','--use-angle=swiftshader','--enable-webgl','--ignore-gpu-blocklist']});
  try{
    const page=await browser.newPage({viewport:{width:1440,height:1000},deviceScaleFactor:1});
    const errors=[];page.on('pageerror',e=>errors.push(String(e)));
    await page.goto('http://127.0.0.1:4173/',{waitUntil:'domcontentloaded',timeout:30000});
    await page.waitForFunction(()=>document.querySelector('[data-model-slot="boot-tv"]')?.dataset.glbState==='ready',null,{timeout:25000});
    await page.waitForFunction(()=>document.documentElement.dataset.crtObjectVolume==='v371-ready',null,{timeout:12000});
    await page.waitForFunction(()=>Number(document.querySelector('#boot')?.dataset.v371Frame||0)>10,null,{timeout:8000,polling:'raf'});

    const settle=async(channel,predicate)=>{
      const started=Date.now();
      await page.locator(`[data-crt-mode-control="${channel}"]`).click();

      /* Pose authority should be measured without visitor parallax helping the
         yaw predicate. Neutralize the already-existing scene pointer at the real
         scene center rather than relying on a hard-coded viewport coordinate. */
      const sceneBox=await page.locator('#boot .scene-inner').boundingBox();
      assert.ok(sceneBox&&sceneBox.width>0&&sceneBox.height>0,'Scene 01 has no measurable interaction area');
      await page.mouse.move(sceneBox.x+sceneBox.width/2,sceneBox.y+sceneBox.height/2,{steps:8});

      /* v365/v367/v371 all converge on the shared v322 RAF. A busy SwiftShader
         runner can deliver far fewer frames per wall-clock second, so preserve
         every semantic/physical predicate and allow the frame-driven system a
         finite 20s window instead of treating 12s as part of the behavior. */
      await page.waitForFunction(({channel,predicate})=>{
        const inst=window.MOVX3D?.runtime?.instances?.['boot-tv'];
        if(!inst?.objectVolume||!inst?.channelPhysics||!inst?.sceneDirector||!inst?.channels)return false;
        const boot=document.querySelector('#boot');
        const groupYaw=inst.group.rotation.y;
        const ok=Function('v',`return (${predicate})(v)`)(groupYaw);
        return boot?.dataset.crtPhysicalChannel===channel &&
          inst.channels.state.channel===channel &&
          inst.objectVolume.state.channel===channel &&
          inst.channelPhysics.state.channel===channel &&
          inst.sceneDirector.state.channel===channel &&
          inst.sceneDirector.state.channelMix>.86 &&
          Math.abs(inst.objectVolume.state.pointerYaw)<.014 && ok;
      },{channel,predicate},{timeout:20000,polling:'raf'});
      const state=await page.evaluate(()=>{
        const root=document.documentElement,boot=document.querySelector('#boot');
        const inst=window.MOVX3D.runtime.instances['boot-tv'];
        return {
          channel:inst.channels.state.channel,
          physical:boot.dataset.crtPhysicalChannel,
          groupYaw:inst.group.rotation.y,
          groupPitch:inst.group.rotation.x,
          groupRoll:inst.group.rotation.z,
          groupDepth:inst.group.position.z,
          modeYaw:parseFloat(getComputedStyle(root).getPropertyValue('--crt-mode-yaw'))||0,
          modePitch:parseFloat(getComputedStyle(root).getPropertyValue('--crt-mode-pitch'))||0,
          modeRoll:parseFloat(getComputedStyle(root).getPropertyValue('--crt-mode-roll'))||0,
          modeZoom:parseFloat(getComputedStyle(root).getPropertyValue('--crt-mode-zoom'))||0,
          physicsYaw:inst.channelPhysics.state.yaw,
          volumeYaw:inst.objectVolume.state.yaw,
          pointerYaw:inst.objectVolume.state.pointerYaw,
          directorMix:inst.sceneDirector.state.channelMix,
          renderers:document.querySelectorAll('.v322-model-renderer').length,
          activeSlots:window.MOVX3D.runtime.activeSlots,
          overflow:root.scrollWidth-innerWidth,
        };
      });
      state.settleMs=Date.now()-started;
      return state;
    };

    const direction=await settle('direction','v=>v<-.10');
    const motion=await settle('motion','v=>v>.10');
    const ai=await settle('ai','v=>v<-.055');
    const digital=await settle('digital','v=>v>.055');

    assert.ok(direction.modeYaw<-.10,'DIREÇÃO semantic yaw did not reach runtime');
    assert.ok(motion.modeYaw>.10,'MOTION semantic yaw did not reach runtime');
    assert.ok(ai.modeYaw<-.04,'AI semantic yaw did not reach runtime');
    assert.ok(digital.modeYaw>.08,'DIGITAL semantic yaw did not reach runtime');
    assert.ok(direction.groupYaw<-.10,`DIREÇÃO cabinet too flat: ${direction.groupYaw}`);
    assert.ok(motion.groupYaw>.10,`MOTION cabinet did not reveal opposite side: ${motion.groupYaw}`);
    assert.ok(ai.groupYaw<-.055,`AI cabinet did not return to negative three-quarter view: ${ai.groupYaw}`);
    assert.ok(digital.groupYaw>.055,`DIGITAL cabinet did not hold positive three-quarter view: ${digital.groupYaw}`);
    assert.ok(motion.groupYaw-direction.groupYaw>.20,'channel pose separation is too small to read as physical retuning');
    assert.ok(digital.groupYaw-ai.groupYaw>.11,'AI/DIGITAL physical pose separation is too small');
    for(const s of [direction,motion,ai,digital]){
      assert.ok(Math.abs(s.pointerYaw)<.014,'semantic pose was measured with pointer yaw still active');
      assert.equal(s.renderers,1);assert.deepEqual(s.activeSlots,['boot-tv']);assert.ok(s.overflow<=2);
    }
    assert.equal(errors.length,0,'desktop page errors: '+errors.join(' | '));
    await page.screenshot({path:'_site/qa-v372-channel-pose-digital.png',fullPage:false});
    fs.writeFileSync('_site/qa-v372-channel-pose.json',JSON.stringify({direction,motion,ai,digital},null,2));
    console.log(JSON.stringify({qa:'v372-channel-pose-authority',status:'PASS',direction,motion,ai,digital}));
    await page.close();

    const reduced=await browser.newPage({viewport:{width:1280,height:800},reducedMotion:'reduce'});
    await reduced.goto('http://127.0.0.1:4173/',{waitUntil:'domcontentloaded',timeout:30000});
    await reduced.waitForFunction(()=>document.querySelector('[data-model-slot="boot-tv"]')?.dataset.glbState==='ready',null,{timeout:25000});
    await reduced.waitForFunction(()=>document.documentElement.dataset.crtObjectVolume==='v371-ready',null,{timeout:12000});
    await reduced.locator('[data-crt-mode-control="motion"]').click();
    await reduced.waitForFunction(()=>{
      const i=window.MOVX3D.runtime.instances['boot-tv'];
      return i.channels.state.channel==='motion'&&i.sceneDirector.state.channel==='motion'&&i.sceneDirector.state.channelMix>.85&&i.group.rotation.y>.10;
    },null,{timeout:15000,polling:'raf'});
    const reducedState=await reduced.evaluate(()=>{const i=window.MOVX3D.runtime.instances['boot-tv'];return {reduced:i.objectVolume.state.reduced,yaw:i.group.rotation.y,pointerYaw:i.objectVolume.state.pointerYaw,idleYaw:i.objectVolume.state.idleYaw,renderers:document.querySelectorAll('.v322-model-renderer').length,activeSlots:window.MOVX3D.runtime.activeSlots}});
    assert.equal(reducedState.reduced,true);assert.equal(reducedState.pointerYaw,0);assert.equal(reducedState.idleYaw,0);assert.ok(reducedState.yaw>.10);assert.equal(reducedState.renderers,1);assert.deepEqual(reducedState.activeSlots,['boot-tv']);
    console.log(JSON.stringify({qa:'v372-channel-pose-authority',viewport:'reduced',status:'PASS',reducedState}));
    await reduced.close();
  } finally {await browser.close()}
})().catch(err=>{console.error(err);process.exit(1)});
