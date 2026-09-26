const { chromium } = require('playwright');
const fs = require('fs');

(async()=>{
  const browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-webgl','--ignore-gpu-blocklist']});
  const page=await browser.newPage({
    viewport:{width:390,height:844},
    deviceScaleFactor:1,
    hasTouch:true,
    isMobile:true
  });
  const errors=[];
  const critical=/\.(?:glb|gltf|mjs|js|css)(?:\?|$)/i;
  page.on('pageerror',e=>errors.push(`PAGEERROR ${String(e)}`));
  page.on('response',res=>{if(res.status()>=400&&critical.test(res.url()))errors.push(`HTTP ${res.status()} ${res.url()}`)});
  page.on('requestfailed',req=>{if(critical.test(req.url()))errors.push(`REQUEST FAILED ${req.url()} ${req.failure()?.errorText||''}`)});

  await page.goto('http://127.0.0.1:4173/',{waitUntil:'domcontentloaded',timeout:120000});
  await page.waitForFunction(()=>document.documentElement.dataset.modelChoreography==='v331-smooth-handoffs',{timeout:30000});
  await page.waitForFunction(()=>{
    const rt=window.MOVX3D?.runtime;
    return !!(rt&&rt.contextLimit===2&&rt.choreographyVersion==='v331-smooth-handoffs'&&rt.choreographyDamping==='frame-rate-independent');
  },{timeout:30000});

  const runtimeInfo=await page.evaluate(()=>({
    contextLimit:window.MOVX3D?.runtime?.contextLimit,
    motionScale:window.MOVX3D?.runtime?.choreographyMotionScale,
    version:window.MOVX3D?.runtime?.choreographyVersion,
    damping:window.MOVX3D?.runtime?.choreographyDamping,
    coarse:matchMedia('(pointer:coarse)').matches,
    overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth
  }));
  if(runtimeInfo.contextLimit!==2)throw new Error(`mobile context limit must be 2, got ${runtimeInfo.contextLimit}`);
  if(runtimeInfo.version!=='v331-smooth-handoffs')throw new Error(`wrong choreography ${runtimeInfo.version}`);
  if(runtimeInfo.damping!=='frame-rate-independent')throw new Error(`wrong damping contract ${runtimeInfo.damping}`);
  if(runtimeInfo.overflow>2)throw new Error(`initial mobile horizontal overflow ${runtimeInfo.overflow}`);

  const slots=['hero-movx-logo','x-portal','creative-machine','play-camera','play-cube','spatial-studio'];
  const report={runtime:runtimeInfo,slots:{},rendererSamples:0};

  for(const slot of slots){
    const selector=`[data-model-slot="${slot}"]`;
    const loc=page.locator(selector).first();
    if(await loc.count()!==1)throw new Error(`missing mobile slot ${slot}`);

    await page.evaluate(sel=>{
      const el=document.querySelector(sel);if(!el)return;
      const r=el.getBoundingClientRect();
      const top=Math.max(0,window.scrollY+r.top-(window.innerHeight-r.height)/2);
      window.scrollTo({top,behavior:'instant'});
    },selector);
    await page.waitForTimeout(1100);

    await page.waitForFunction(name=>{
      const i=window.MOVX3D?.runtime?.instances?.[name];
      return !!(i?.loaded||i?.error);
    },slot,{timeout:90000});

    // On touch the runtime intentionally keeps only two WebGL contexts alive.
    // A successfully loaded model may therefore be hibernated while a nearby
    // storyboard slot is mounted. Validate the loaded/choreography contract
    // rather than incorrectly requiring every model to keep a renderer alive.
    await page.waitForFunction(name=>{
      const i=window.MOVX3D?.runtime?.instances?.[name];
      return !!(i?.error||(i?.loaded&&i?.v331ChoreographyReady&&Number.isFinite(i?.v331Progress)));
    },slot,{timeout:20000});

    const info=await page.evaluate(name=>{
      const rt=window.MOVX3D.runtime;
      const i=rt.instances[name];
      const r=i.element.getBoundingClientRect();
      const canvas=i.canvas?.getBoundingClientRect?.();
      const live=Object.values(rt.instances).filter(x=>x.renderer).length;
      return {
        loaded:i.loaded,error:i.error||null,liveRenderers:live,hasRenderer:!!i.renderer,
        stats:i.stats||null,glbState:i.element.dataset.glbState,
        choreography:i.element.dataset.modelChoreography||null,
        progress:Number.isFinite(i.v331Progress)?i.v331Progress:null,
        target:Number.isFinite(i.v331TargetProgress)?i.v331TargetProgress:null,
        slotRect:{left:r.left,right:r.right,width:r.width,height:r.height},
        canvas:canvas?{width:canvas.width,height:canvas.height}:null,
        overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth
      };
    },slot);

    if(info.error)throw new Error(`${slot} mobile GLB failed: ${info.error}`);
    if(!info.loaded)throw new Error(`${slot} mobile GLB did not load`);
    if(!info.stats?.triangles)throw new Error(`${slot} mobile GLB stats missing`);
    if(info.liveRenderers>2)throw new Error(`${slot} exceeded mobile WebGL context policy: ${info.liveRenderers}`);
    if(info.liveRenderers<1)throw new Error(`${slot} has no active mobile WebGL renderer`);
    if(info.choreography!=='v331'||info.progress===null||info.target===null)throw new Error(`${slot} missing v331 choreography state`);
    if(info.hasRenderer){
      if(!info.canvas||info.canvas.width<2||info.canvas.height<2)throw new Error(`${slot} invalid mobile canvas ${JSON.stringify(info.canvas)}`);
      report.rendererSamples++;
    }else if(info.glbState!=='hibernated'){
      throw new Error(`${slot} renderer absent outside valid hibernation state: ${info.glbState}`);
    }
    if(info.overflow>2)throw new Error(`${slot} introduced horizontal overflow ${info.overflow}`);
    if(info.slotRect.left<-3||info.slotRect.right>393)throw new Error(`${slot} slot exceeds mobile viewport ${JSON.stringify(info.slotRect)}`);

    report.slots[slot]=info;
    fs.writeFileSync('_site/qa-v332-mobile-report.json',JSON.stringify({status:'running',...report,currentSlot:slot},null,2));
    await page.screenshot({path:`_site/qa-v332-${slot}.png`,fullPage:false});
  }

  if(report.rendererSamples<1)throw new Error('mobile 3D QA never observed an active slot renderer');
  if(errors.length)throw new Error('mobile critical resource errors: '+JSON.stringify(errors));
  fs.writeFileSync('_site/qa-v332-mobile-report.json',JSON.stringify({status:'passed',...report},null,2));
  await browser.close();
  console.log(JSON.stringify({status:'passed',viewport:'390x844',contextLimit:runtimeInfo.contextLimit,rendererSamples:report.rendererSamples,slots}));
})().catch(err=>{console.error(err);process.exit(1)});
