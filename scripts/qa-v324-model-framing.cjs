const { chromium } = require('playwright');
const fs = require('fs');

(async()=>{
  const browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-webgl','--ignore-gpu-blocklist']});
  const page=await browser.newPage({viewport:{width:1440,height:1000},deviceScaleFactor:1});
  const errors=[];
  const critical=/\.(?:glb|gltf|mjs|js|css)(?:\?|$)/i;
  page.on('pageerror',e=>errors.push(`PAGEERROR ${String(e)}`));
  page.on('response',res=>{if(res.status()>=400&&critical.test(res.url()))errors.push(`HTTP ${res.status()} ${res.url()}`)});
  page.on('requestfailed',req=>{if(critical.test(req.url()))errors.push(`REQUEST FAILED ${req.url()} ${req.failure()?.errorText||''}`)});
  await page.goto('http://127.0.0.1:4173/',{waitUntil:'domcontentloaded',timeout:120000});
  await page.waitForFunction(()=>document.documentElement.dataset.modelFraming==='v324-model-framing',null,{timeout:30000});
  await page.waitForFunction(()=>document.documentElement.dataset.modelFramingRevision==='v336-mobile-logo-fit',null,{timeout:30000});
  await page.waitForFunction(()=>document.documentElement.dataset.modelChoreography==='v331-smooth-handoffs',null,{timeout:30000});

  const expected={
    'hero-movx-logo':[140000,160000],
    'x-portal':[95000,115000],
    'creative-machine':[135000,155000],
    'play-camera':[145000,165000],
    'play-cube':[138000,158000],
    'spatial-studio':[175000,195000]
  };
  const report={};
  for(const [slot,range] of Object.entries(expected)){
    const selector=`[data-model-slot="${slot}"]`;
    const loc=page.locator(selector).first();
    if(await loc.count()!==1)throw new Error(`Missing slot ${slot}`);
    await page.evaluate((sel)=>{
      const el=document.querySelector(sel);if(!el)return;
      const r=el.getBoundingClientRect();
      const top=Math.max(0,window.scrollY+r.top-(window.innerHeight-r.height)/2);
      window.scrollTo({top,behavior:'instant'});
    },selector);
    await page.waitForTimeout(900);

    await page.waitForFunction((name)=>{const i=window.MOVX3D?.runtime?.instances?.[name];return !!(i?.loaded||i?.error)},slot,{timeout:90000});
    await page.waitForFunction((name)=>{
      const i=window.MOVX3D?.runtime?.instances?.[name];
      return !!(i?.error||(i?.v324Tuned&&i?.v331ChoreographyReady&&Number.isFinite(i?.v331Progress)&&Number.isFinite(i?.v331TargetProgress)));
    },slot,{timeout:10000});

    const info=await page.evaluate((name)=>{
      const i=window.MOVX3D.runtime.instances[name];
      return {
        loaded:i.loaded,error:i.error||null,stats:i.stats||null,tuned:!!i.v324Tuned,
        glbState:i.element.dataset.glbState,framing:i.element.dataset.modelFraming||null,
        framingRevision:i.element.dataset.modelFramingRevision||null,
        tuning:i.v324Tuning||null,mobileLogoFit:!!i.v336MobileLogoFit,
        choreographyReady:!!i.v331ChoreographyReady,
        choreography:i.element.dataset.modelChoreography||null,
        progress:Number.isFinite(i.v331Progress)?i.v331Progress:null,
        targetProgress:Number.isFinite(i.v331TargetProgress)?i.v331TargetProgress:null,
        velocity:Number.isFinite(i.v331Velocity)?i.v331Velocity:null,
        cameraZ:i.camera?.position?.z??null,
        baseCameraZ:i.v330Base?.cameraZ??null,
        runtimeVersion:window.MOVX3D.runtime.choreographyVersion||null,
        damping:window.MOVX3D.runtime.choreographyDamping||null
      };
    },slot);
    if(info.error)throw new Error(`${slot} GLB failed: ${info.error}`);
    if(!info.loaded)throw new Error(`${slot} did not load`);
    if(!info.tuned||info.framing!=='v324')throw new Error(`${slot} framing was not applied`);
    if(info.framingRevision!=='v336-mobile-logo-fit')throw new Error(`${slot} v336 framing revision missing: ${info.framingRevision}`);
    if(info.mobileLogoFit)throw new Error(`${slot} unexpectedly received mobile logo fit on desktop`);
    if(!info.choreographyReady||info.choreography!=='v331'||info.progress===null||info.targetProgress===null)throw new Error(`${slot} v331 choreography was not applied`);
    if(info.runtimeVersion!=='v331-smooth-handoffs'||info.damping!=='frame-rate-independent')throw new Error(`${slot} v331 damping contract missing`);
    const tris=info.stats?.triangles||0;
    if(tris<range[0]||tris>range[1])throw new Error(`${slot} triangles ${tris} outside expected ${range[0]}-${range[1]}`);
    report[slot]=info;
    fs.writeFileSync('_site/qa-v324-model-report.json',JSON.stringify({status:'running',framingRevision:'v336-mobile-logo-fit',choreography:'v331-smooth-handoffs',report},null,2));
    await page.waitForTimeout(250);
    await page.screenshot({path:`_site/qa-v324-${slot}.png`,fullPage:false});
  }

  /* v336: the GLB is ~3.9:1, so container-only mobile QA can be green while M/X are
     clipped by the camera frustum. Validate the normalized model against the actual
     390px canvas aspect and the worst v331 yaw/dolly, with renderer-scale reserve. */
  const mobile=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1,hasTouch:true,isMobile:true});
  const mobileErrors=[];
  mobile.on('pageerror',e=>mobileErrors.push(`PAGEERROR ${String(e)}`));
  mobile.on('response',res=>{if(res.status()>=400&&critical.test(res.url()))mobileErrors.push(`HTTP ${res.status()} ${res.url()}`)});
  mobile.on('requestfailed',req=>{if(critical.test(req.url()))mobileErrors.push(`REQUEST FAILED ${req.url()} ${req.failure()?.errorText||''}`)});
  await mobile.goto('http://127.0.0.1:4173/',{waitUntil:'domcontentloaded',timeout:120000});
  await mobile.waitForFunction(()=>document.documentElement.dataset.modelFramingRevision==='v336-mobile-logo-fit',null,{timeout:30000});
  const logoSelector='[data-model-slot="hero-movx-logo"]';
  await mobile.evaluate(sel=>{
    const el=document.querySelector(sel);const r=el.getBoundingClientRect();
    window.scrollTo({top:Math.max(0,scrollY+r.top-(innerHeight-r.height)/2),behavior:'instant'});
  },logoSelector);
  await mobile.waitForFunction(()=>{
    const i=window.MOVX3D?.runtime?.instances?.['hero-movx-logo'];
    return !!(i?.loaded&&i?.v324Tuned&&i?.v336MobileLogoFit&&i?.element?.dataset?.glbState==='ready');
  },null,{timeout:90000});
  await mobile.waitForTimeout(1100);
  const mobileLogo=await mobile.evaluate(()=>{
    const i=window.MOVX3D.runtime.instances['hero-movx-logo'];
    return {
      sourceSize:i.stats?.sourceSize||null,
      normalizedScale:i.stats?.normalizedScale||null,
      tuning:i.v324Tuning||null,
      width:i.width||i.element.getBoundingClientRect().width,
      height:i.height||i.element.getBoundingClientRect().height,
      fov:i.camera?.fov||null,
      cameraZ:i.camera?.position?.z||null,
      baseCameraZ:i.v330Base?.cameraZ||null,
      framingRevision:i.element.dataset.modelFramingRevision||null,
      mobileFit:i.element.dataset.mobileLogoFit||null,
      runtimeMobileFit:window.MOVX3D.runtime.mobileLogoFit||null,
      choreographyMotionScale:window.MOVX3D.runtime.choreographyMotionScale??1
    };
  });
  if(!mobileLogo.sourceSize||!mobileLogo.normalizedScale||!mobileLogo.tuning)throw new Error(`v336 mobile logo metrics missing ${JSON.stringify(mobileLogo)}`);
  if(mobileLogo.framingRevision!=='v336-mobile-logo-fit'||mobileLogo.mobileFit!=='v336'||mobileLogo.runtimeMobileFit!=='v336')throw new Error(`v336 mobile logo fit marker missing ${JSON.stringify(mobileLogo)}`);
  const src=mobileLogo.sourceSize;
  const scale=mobileLogo.normalizedScale*mobileLogo.tuning.scale;
  const modelWidth=src.x*scale;
  const modelDepth=src.z*scale;
  const worstYaw=.10;
  const rendererScale=1.011;
  const mobileHostStretch=1.04;
  const worstWidth=(Math.abs(modelWidth*Math.cos(worstYaw))+Math.abs(modelDepth*Math.sin(worstYaw)))*rendererScale*mobileHostStretch;
  const minCameraZ=mobileLogo.tuning.cameraZ-.06;
  const aspect=mobileLogo.width/mobileLogo.height;
  const visibleWidth=2*minCameraZ*Math.tan((mobileLogo.tuning.fov*Math.PI/180)/2)*aspect;
  const fitRatio=worstWidth/visibleWidth;
  const fit={...mobileLogo,modelWidth,modelDepth,worstWidth,minCameraZ,aspect,visibleWidth,fitRatio,horizontalReserve:1-fitRatio};
  if(!(fitRatio>0&&fitRatio<=.90))throw new Error(`v336 mobile logo projection exceeds safe frustum ratio: ${JSON.stringify(fit)}`);
  if(mobileErrors.length)throw new Error('Critical mobile browser resource errors: '+JSON.stringify(mobileErrors));
  report.mobileLogoFit=fit;
  await mobile.screenshot({path:'_site/qa-v324-hero-movx-logo-mobile.png',fullPage:false});
  await mobile.close();

  if(errors.length)throw new Error('Critical browser resource errors: '+JSON.stringify(errors));
  fs.writeFileSync('_site/qa-v324-model-report.json',JSON.stringify({status:'passed',framingRevision:'v336-mobile-logo-fit',choreography:'v331-smooth-handoffs',report},null,2));
  await page.close();
  await browser.close();
  console.log(JSON.stringify({status:'passed',framingRevision:'v336-mobile-logo-fit',choreography:'v331-smooth-handoffs',slots:Object.keys(expected),mobileLogoFit:Number(fitRatio.toFixed(4)),criticalErrors:[...errors,...mobileErrors]}));
})().catch(async err=>{console.error(err);process.exit(1)});
