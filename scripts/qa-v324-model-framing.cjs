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
  await page.waitForFunction(()=>document.documentElement.dataset.modelFraming==='v324-model-framing',{timeout:30000});
  await page.waitForFunction(()=>document.documentElement.dataset.modelChoreography==='v331-smooth-handoffs',{timeout:30000});

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
        tuning:i.v324Tuning||null,
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
    if(!info.choreographyReady||info.choreography!=='v331'||info.progress===null||info.targetProgress===null)throw new Error(`${slot} v331 choreography was not applied`);
    if(info.runtimeVersion!=='v331-smooth-handoffs'||info.damping!=='frame-rate-independent')throw new Error(`${slot} v331 damping contract missing`);
    const tris=info.stats?.triangles||0;
    if(tris<range[0]||tris>range[1])throw new Error(`${slot} triangles ${tris} outside expected ${range[0]}-${range[1]}`);
    report[slot]=info;
    fs.writeFileSync('_site/qa-v324-model-report.json',JSON.stringify({status:'running',choreography:'v331-smooth-handoffs',report},null,2));
    await page.waitForTimeout(250);
    await page.screenshot({path:`_site/qa-v324-${slot}.png`,fullPage:false});
  }
  if(errors.length)throw new Error('Critical browser resource errors: '+JSON.stringify(errors));
  fs.writeFileSync('_site/qa-v324-model-report.json',JSON.stringify({status:'passed',choreography:'v331-smooth-handoffs',report},null,2));
  await browser.close();
  console.log(JSON.stringify({status:'passed',choreography:'v331-smooth-handoffs',slots:Object.keys(report),criticalErrors:errors}));
})().catch(async err=>{console.error(err);process.exit(1)});
