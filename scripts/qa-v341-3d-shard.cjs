const { chromium } = require('playwright');
const fs = require('fs');

const ALL_SLOTS = ['hero-movx-logo','x-portal','creative-machine','play-camera','play-cube','spatial-studio'];
const EXPECTED_TRIANGLES = {
  'hero-movx-logo':[140000,160000],
  'x-portal':[95000,115000],
  'creative-machine':[135000,155000],
  'play-camera':[145000,165000],
  'play-cube':[138000,158000],
  'spatial-studio':[175000,195000]
};

const mode = (process.env.MOVX_QA_MODE || 'desktop').toLowerCase();
const shard = (process.env.MOVX_QA_SHARD || 'single').replace(/[^a-z0-9_-]/gi,'-');
const requested = (process.env.MOVX_QA_SLOTS || ALL_SLOTS.join(','))
  .split(',').map(s=>s.trim()).filter(Boolean);
const unknown = requested.filter(slot=>!ALL_SLOTS.includes(slot));
if(unknown.length) throw new Error(`Unknown MOVX_QA_SLOTS: ${unknown.join(', ')}`);
if(!requested.length) throw new Error('MOVX_QA_SLOTS resolved to an empty shard');
if(!['desktop','mobile'].includes(mode)) throw new Error(`Unsupported MOVX_QA_MODE: ${mode}`);

(async()=>{
  const browser = await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-webgl','--ignore-gpu-blocklist']});
  const mobile = mode === 'mobile';
  const page = await browser.newPage(mobile ? {
    viewport:{width:390,height:844},deviceScaleFactor:1,hasTouch:true,isMobile:true
  } : {
    viewport:{width:1440,height:1000},deviceScaleFactor:1
  });

  const errors = [];
  const captureWarnings = [];
  const critical = /\.(?:glb|gltf|mjs|js|css)(?:\?|$)/i;
  const report = {mode,shard,slots:requested,runtime:null,models:{},captureWarnings};
  const reportPath = `_site/qa-v341-${mode}-${shard}-report.json`;

  const snap = async(slot)=>{
    const path = `_site/qa-v341-${mode}-${shard}-${slot}.png`;
    try{
      await page.screenshot({path,fullPage:false,animations:'disabled',timeout:8000});
    }catch(error){
      captureWarnings.push({slot,path,error:String(error)});
    }
  };

  page.on('pageerror',e=>errors.push(`PAGEERROR ${String(e)}`));
  page.on('response',res=>{ if(res.status()>=400 && critical.test(res.url())) errors.push(`HTTP ${res.status()} ${res.url()}`); });
  page.on('requestfailed',req=>{ if(critical.test(req.url())) errors.push(`REQUEST FAILED ${req.url()} ${req.failure()?.errorText||''}`); });

  await page.goto('http://127.0.0.1:4173/',{waitUntil:'domcontentloaded',timeout:60000});
  await page.waitForFunction(()=>document.documentElement.dataset.modelFraming==='v324-model-framing',null,{timeout:20000});
  await page.waitForFunction(()=>document.documentElement.dataset.modelFramingRevision==='v3361-mobile-logo-safe-fit',null,{timeout:20000});
  await page.waitForFunction(()=>document.documentElement.dataset.modelChoreography==='v331-smooth-handoffs',null,{timeout:20000});
  await page.waitForFunction(()=>!!window.MOVX3D?.runtime,null,{timeout:20000});

  report.runtime = await page.evaluate(()=>({
    contextLimit:window.MOVX3D.runtime.contextLimit,
    choreographyVersion:window.MOVX3D.runtime.choreographyVersion,
    choreographyDamping:window.MOVX3D.runtime.choreographyDamping,
    mobileLogoFit:window.MOVX3D.runtime.mobileLogoFit||null,
    coarse:matchMedia('(pointer:coarse)').matches,
    overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth
  }));

  if(report.runtime.choreographyVersion!=='v331-smooth-handoffs') throw new Error(`wrong choreography ${report.runtime.choreographyVersion}`);
  if(report.runtime.choreographyDamping!=='frame-rate-independent') throw new Error(`wrong damping ${report.runtime.choreographyDamping}`);
  if(mobile && report.runtime.contextLimit!==2) throw new Error(`mobile context limit must be 2, got ${report.runtime.contextLimit}`);
  if(!mobile && report.runtime.contextLimit>3) throw new Error(`desktop context limit exceeded: ${report.runtime.contextLimit}`);
  if(report.runtime.overflow>2) throw new Error(`initial horizontal overflow ${report.runtime.overflow}`);

  for(const slot of requested){
    const selector = `[data-model-slot="${slot}"]`;
    const loc = page.locator(selector).first();
    if(await loc.count()!==1) throw new Error(`missing slot ${slot}`);

    await page.evaluate(sel=>{
      const el=document.querySelector(sel); if(!el) return;
      const r=el.getBoundingClientRect();
      const top=Math.max(0,window.scrollY+r.top-(window.innerHeight-r.height)/2);
      window.scrollTo({top,behavior:'instant'});
    },selector);
    await page.waitForTimeout(mobile?750:600);

    await page.waitForFunction(name=>{
      const i=window.MOVX3D?.runtime?.instances?.[name];
      return !!(i?.loaded||i?.error);
    },slot,{timeout:75000});

    await page.waitForFunction(name=>{
      const i=window.MOVX3D?.runtime?.instances?.[name];
      return !!(i?.error||(i?.loaded&&i?.v324Tuned&&i?.v331ChoreographyReady&&Number.isFinite(i?.v331Progress)&&Number.isFinite(i?.v331TargetProgress)));
    },slot,{timeout:15000});

    const info = await page.evaluate(name=>{
      const rt=window.MOVX3D.runtime;
      const i=rt.instances[name];
      const r=i.element.getBoundingClientRect();
      const canvas=i.canvas?.getBoundingClientRect?.();
      return {
        loaded:!!i.loaded,error:i.error||null,stats:i.stats||null,
        glbState:i.element.dataset.glbState||null,
        tuned:!!i.v324Tuned,framing:i.element.dataset.modelFraming||null,
        framingRevision:i.element.dataset.modelFramingRevision||null,
        mobileLogoFit:!!i.v3361MobileLogoSafeFit,
        choreographyReady:!!i.v331ChoreographyReady,
        choreography:i.element.dataset.modelChoreography||null,
        progress:Number.isFinite(i.v331Progress)?i.v331Progress:null,
        targetProgress:Number.isFinite(i.v331TargetProgress)?i.v331TargetProgress:null,
        liveRenderers:Object.values(rt.instances).filter(x=>x.renderer).length,
        hasRenderer:!!i.renderer,
        canvas:canvas?{width:canvas.width,height:canvas.height}:null,
        slotRect:{left:r.left,right:r.right,width:r.width,height:r.height},
        overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth
      };
    },slot);

    if(info.error) throw new Error(`${slot} GLB failed: ${info.error}`);
    if(!info.loaded) throw new Error(`${slot} did not load`);
    if(!info.tuned || info.framing!=='v324') throw new Error(`${slot} framing missing`);
    if(info.framingRevision!=='v3361-mobile-logo-safe-fit') throw new Error(`${slot} framing revision missing: ${info.framingRevision}`);
    if(!info.choreographyReady || info.choreography!=='v331' || info.progress===null || info.targetProgress===null) throw new Error(`${slot} choreography state missing`);

    const tris = info.stats?.triangles || 0;
    const range = EXPECTED_TRIANGLES[slot];
    if(tris<range[0] || tris>range[1]) throw new Error(`${slot} triangles ${tris} outside ${range[0]}-${range[1]}`);

    if(mobile){
      if(info.liveRenderers>2) throw new Error(`${slot} exceeded mobile WebGL context policy: ${info.liveRenderers}`);
      if(info.liveRenderers<1) throw new Error(`${slot} has no active mobile renderer`);
      if(info.hasRenderer){
        if(!info.canvas || info.canvas.width<2 || info.canvas.height<2) throw new Error(`${slot} invalid mobile canvas ${JSON.stringify(info.canvas)}`);
      }else if(info.glbState!=='hibernated'){
        throw new Error(`${slot} renderer absent outside hibernation: ${info.glbState}`);
      }
      if(info.overflow>2) throw new Error(`${slot} introduced mobile horizontal overflow ${info.overflow}`);
      if(info.slotRect.left<-3 || info.slotRect.right>393) throw new Error(`${slot} exceeds mobile viewport ${JSON.stringify(info.slotRect)}`);
      if(slot==='hero-movx-logo' && !info.mobileLogoFit) throw new Error('hero mobile safe-fit marker missing');
    }else if(info.mobileLogoFit){
      throw new Error(`${slot} unexpectedly received mobile logo fit on desktop`);
    }

    report.models[slot]=info;
    fs.writeFileSync(reportPath,JSON.stringify({...report,status:'running',currentSlot:slot},null,2));
    await snap(slot);
  }

  if(errors.length) throw new Error(`Critical browser resource errors: ${JSON.stringify(errors)}`);
  fs.writeFileSync(reportPath,JSON.stringify({...report,status:'passed',criticalErrors:errors},null,2));
  await page.close();
  await browser.close();
  console.log(JSON.stringify({status:'passed',mode,shard,slots:requested,captureWarnings:captureWarnings.length}));
})().catch(err=>{ console.error(err); process.exit(1); });
