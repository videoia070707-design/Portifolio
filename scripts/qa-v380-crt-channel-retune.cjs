const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');

(async()=>{
  const models=fs.readdirSync('_site/models').filter(x=>x.toLowerCase().endsWith('.glb')).sort();
  assert.deepEqual(models,['movx-crt-tv.glb'],'v380 must keep exactly one production GLB');
  const browser=await chromium.launch({headless:true,args:['--no-sandbox','--use-angle=swiftshader','--enable-webgl','--ignore-gpu-blocklist']});
  try{
    const inspect=page=>page.evaluate(()=>{
      const root=document.documentElement,boot=document.querySelector('#boot');
      const inst=window.MOVX3D?.runtime?.instances?.['boot-tv'];
      const retune=inst?.channelRetune;
      const knob=inst?.model?.getObjectByName?.('tripo_part_8');
      return {
        layer:root.dataset.crtRetuneLayer,
        ready:root.dataset.crtChannelRetune,
        loop:root.dataset.crtChannelRetuneLoop,
        phase:boot?.dataset?.v380Retune,
        channel:boot?.dataset?.v380Channel,
        renderers:document.querySelectorAll('.v322-model-renderer').length,
        activeSlots:window.MOVX3D?.runtime?.activeSlots||[],
        errors:window.MOVX3D?.runtime?.errors||[],
        triangles:inst?.stats?.triangles,
        state:retune?{
          reduced:retune.state.reduced,coarse:retune.state.coarse,channel:retune.state.channel,
          switches:retune.state.switches,direction:retune.state.direction,
          envelope:retune.state.envelope,wave:retune.state.wave,elapsedMs:retune.state.elapsedMs,
          depthKick:retune.state.depthKick,yawKick:retune.state.yawKick,
          fovKick:retune.state.fovKick,lightLift:retune.state.lightLift,
          knobAngle:retune.state.knobAngle,knobTarget:retune.state.knobTarget,
          manualPriority:retune.state.manualPriority,frames:retune.state.frames,
          duration:retune.duration
        }:null,
        knobZ:Number.isFinite(knob?.rotation?.z)?knob.rotation.z:null,
        fov:inst?.camera?.fov,
        overflow:root.scrollWidth-innerWidth
      };
    });

    const waitImpulse=async(page,switches)=>{
      await page.waitForFunction(({switches})=>{
        const s=window.MOVX3D?.runtime?.instances?.['boot-tv']?.channelRetune?.state;
        return !!s&&s.switches>=switches&&s.envelope>.03;
      },{switches},{timeout:4000});
    };

    const page=await browser.newPage({viewport:{width:1440,height:1000},deviceScaleFactor:1});
    const errors=[];page.on('pageerror',e=>errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
    await page.goto('http://127.0.0.1:4173/',{waitUntil:'domcontentloaded',timeout:30000});
    await page.waitForFunction(()=>document.querySelector('[data-model-slot="boot-tv"]')?.dataset.glbState==='ready',null,{timeout:25000});
    await page.waitForFunction(()=>document.documentElement.dataset.crtChannelRetune==='v380-ready',null,{timeout:12000});
    await page.waitForFunction(()=>document.documentElement.dataset.motionIntro==='ready',null,{timeout:12000});
    await page.waitForTimeout(250);

    const initial=await inspect(page);
    assert.equal(initial.layer,'v380-physical-channel-retune');
    assert.equal(initial.ready,'v380-ready');assert.equal(initial.loop,'shared-v322-frame');
    assert.equal(initial.renderers,1);assert.deepEqual(initial.activeSlots,['boot-tv']);assert.equal(initial.triangles,44831);
    assert.equal(initial.state.channel,'direction');assert.equal(initial.state.switches,0);assert.ok(initial.state.frames>0);
    assert.equal(initial.errors.length,0);assert.ok(initial.overflow<=2);

    await page.locator('[data-crt-mode-control="motion"]').click();
    await waitImpulse(page,1);
    const motion=await inspect(page);
    assert.equal(motion.channel,'motion');assert.equal(motion.state.channel,'motion');assert.equal(motion.phase,'tuning');
    assert.equal(motion.state.switches,1);assert.ok(motion.state.envelope>.03,`retune envelope too small: ${JSON.stringify(motion.state)}`);
    assert.ok(motion.state.elapsedMs>0&&motion.state.elapsedMs<motion.state.duration,`retune frame clock invalid: ${motion.state.elapsedMs}`);
    assert.ok(Math.abs(motion.state.depthKick)>.0005,`depth kick missing: ${motion.state.depthKick}`);
    assert.ok(Math.abs(motion.state.fovKick)>.01,`focus impulse missing: ${motion.state.fovKick}`);
    assert.ok(motion.state.lightLift>.003,`light lift missing: ${motion.state.lightLift}`);
    assert.equal(motion.state.manualPriority,0);
    if(motion.knobZ!==null){
      assert.ok(motion.state.knobAngle>0&&motion.state.knobAngle<.46,`selector did not travel physically: ${motion.state.knobAngle}`);
    }

    await page.waitForFunction(()=>window.MOVX3D.runtime.instances['boot-tv']?.channelRetune?.state?.phase==='settled',null,{timeout:6000});
    await page.waitForTimeout(180);
    const settled=await inspect(page);
    assert.equal(settled.phase,'settled');assert.ok(settled.state.envelope<.002,`retune did not settle: ${settled.state.envelope}`);
    assert.ok(Math.abs(settled.state.knobAngle-.45)<.015,`selector did not settle on MOTION detent: ${settled.state.knobAngle}`);

    await page.locator('[data-crt-mode-control="ai"]').click();
    await waitImpulse(page,2);
    const ai=await inspect(page);assert.equal(ai.state.channel,'ai');assert.equal(ai.state.direction,1);assert.ok(ai.state.envelope>.02);

    await page.locator('[data-crt-mode-control="direction"]').click();
    await waitImpulse(page,3);
    const reverse=await inspect(page);assert.equal(reverse.state.channel,'direction');assert.equal(reverse.state.direction,-1);assert.ok(reverse.state.envelope>.02);
    assert.equal(errors.length,0,`desktop page errors: ${errors.join(' | ')}`);
    await page.locator('#boot').screenshot({path:'_site/qa-v380-channel-retune-desktop.png'});
    console.log(JSON.stringify({qa:'v380.1.1-channel-retune',viewport:'desktop',status:'PASS',initial,motion,settled,ai,reverse}));
    await page.close();

    const calm=await browser.newPage({viewport:{width:1280,height:800},deviceScaleFactor:1});
    await calm.emulateMedia({reducedMotion:'reduce'});
    await calm.goto('http://127.0.0.1:4173/',{waitUntil:'domcontentloaded',timeout:30000});
    await calm.waitForFunction(()=>document.documentElement.dataset.crtChannelRetune==='v380-ready',null,{timeout:25000});
    await calm.locator('[data-crt-mode-control="digital"]').click();
    await calm.waitForFunction(()=>window.MOVX3D.runtime.instances['boot-tv']?.channelRetune?.state?.switches>=1,null,{timeout:3000});
    await calm.waitForTimeout(80);
    const reducedState=await inspect(calm);
    assert.equal(reducedState.state.reduced,true);assert.equal(reducedState.state.channel,'digital');
    assert.equal(reducedState.phase,'settled');
    for(const [name,value] of Object.entries({envelope:reducedState.state.envelope,wave:reducedState.state.wave,depthKick:reducedState.state.depthKick,fovKick:reducedState.state.fovKick})){
      assert.ok(Number.isFinite(value)&&Math.abs(value)===0,`reduced-motion ${name} must be zero (signed zero allowed): ${value}`);
    }
    assert.equal(reducedState.state.elapsedMs,reducedState.state.duration);
    assert.ok(Math.abs(reducedState.state.knobAngle-1.35)<.001,`reduced-motion selector must settle immediately: ${reducedState.state.knobAngle}`);
    assert.equal(reducedState.renderers,1);assert.deepEqual(reducedState.activeSlots,['boot-tv']);assert.equal(reducedState.errors.length,0);
    console.log(JSON.stringify({qa:'v380.1.1-channel-retune',viewport:'reduced-motion',status:'PASS',state:reducedState}));
    await calm.close();
  } finally {await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
