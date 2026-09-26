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
  await page.waitForFunction(()=>document.documentElement.dataset.modelFramingRevision==='v3361-mobile-logo-safe-fit',null,{timeout:30000});
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
        tuning:i.v324Tuning||null,mobileLogoFit:!!i.v3361MobileLogoSafeFit,
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
    if(info.framingRevision!=='v3361-mobile-logo-safe-fit')throw new Error(`${slot} v336.1 framing revision missing: ${info.framingRevision}`);
    if(info.mobileLogoFit)throw new Error(`${slot} unexpectedly received mobile logo fit on desktop`);
    if(!info.choreographyReady||info.choreography!=='v331'||info.progress===null||info.targetProgress===null)throw new Error(`${slot} v331 choreography was not applied`);
    if(info.runtimeVersion!=='v331-smooth-handoffs'||info.damping!=='frame-rate-independent')throw new Error(`${slot} v331 damping contract missing`);
    const tris=info.stats?.triangles||0;
    if(tris<range[0]||tris>range[1])throw new Error(`${slot} triangles ${tris} outside expected ${range[0]}-${range[1]}`);
    report[slot]=info;
    fs.writeFileSync('_site/qa-v324-model-report.json',JSON.stringify({status:'running',framingRevision:'v3361-mobile-logo-safe-fit',choreography:'v331-smooth-handoffs',report},null,2));
    await page.waitForTimeout(250);
    await page.screenshot({path:`_site/qa-v324-${slot}.png`,fullPage:false});
  }

  /* v336.1: validate the actual physical-logo meshes through the production camera.
     Every mesh bounding-box corner is projected into NDC at 41 progress samples across
     the complete hero scroll choreography. This catches M/X camera clipping that a
     container-only check cannot see. */
  const mobile=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1,hasTouch:true,isMobile:true});
  const mobileErrors=[];
  mobile.on('pageerror',e=>mobileErrors.push(`PAGEERROR ${String(e)}`));
  mobile.on('response',res=>{if(res.status()>=400&&critical.test(res.url()))mobileErrors.push(`HTTP ${res.status()} ${res.url()}`)});
  mobile.on('requestfailed',req=>{if(critical.test(req.url()))mobileErrors.push(`REQUEST FAILED ${req.url()} ${req.failure()?.errorText||''}`)});
  await mobile.goto('http://127.0.0.1:4173/',{waitUntil:'domcontentloaded',timeout:120000});
  await mobile.waitForFunction(()=>document.documentElement.dataset.modelFramingRevision==='v3361-mobile-logo-safe-fit',null,{timeout:30000});
  const logoSelector='[data-model-slot="hero-movx-logo"]';
  await mobile.evaluate(sel=>{
    const el=document.querySelector(sel);const r=el.getBoundingClientRect();
    window.scrollTo({top:Math.max(0,scrollY+r.top-(innerHeight-r.height)/2),behavior:'instant'});
  },logoSelector);
  await mobile.waitForFunction(()=>{
    const i=window.MOVX3D?.runtime?.instances?.['hero-movx-logo'];
    return !!(i?.loaded&&i?.v324Tuned&&i?.v3361MobileLogoSafeFit&&i?.element?.dataset?.glbState==='ready');
  },null,{timeout:90000});
  await mobile.waitForTimeout(1100);

  const mobileLogo=await mobile.evaluate(()=>{
    const i=window.MOVX3D.runtime.instances['hero-movx-logo'];
    const model=i.model,camera=i.camera,scene=i.scene,base=i.v330Base;
    if(!model||!camera||!scene||!base)throw new Error('physical logo projection prerequisites missing');
    const motionScale=window.MOVX3D.runtime.choreographyMotionScale??1;
    const tuning=i.v324Tuning||null;
    const original={
      position:model.position.clone(),rotation:model.rotation.clone(),
      cameraPosition:camera.position.clone()
    };
    const lerp=(a,b,t)=>a+(b-a)*t;
    const smoother=t=>t*t*t*(t*(t*6-15)+10);
    let maxAbsX=0,maxAbsY=0,minX=Infinity,maxX=-Infinity,minY=Infinity,maxY=-Infinity;
    let worstProgressX=0,worstProgressY=0,meshCount=0,cornerSamples=0;
    const point=model.position.clone();
    const sampleCorners=(node,p)=>{
      const geometry=node.geometry;
      if(!geometry)return;
      if(!geometry.boundingBox)geometry.computeBoundingBox();
      const box=geometry.boundingBox;if(!box)return;
      const xs=[box.min.x,box.max.x],ys=[box.min.y,box.max.y],zs=[box.min.z,box.max.z];
      for(const x of xs)for(const y of ys)for(const z of zs){
        point.set(x,y,z).applyMatrix4(node.matrixWorld).project(camera);
        if(!Number.isFinite(point.x)||!Number.isFinite(point.y))continue;
        cornerSamples++;
        const ax=Math.abs(point.x),ay=Math.abs(point.y);
        if(ax>maxAbsX){maxAbsX=ax;worstProgressX=p}
        if(ay>maxAbsY){maxAbsY=ay;worstProgressY=p}
        minX=Math.min(minX,point.x);maxX=Math.max(maxX,point.x);
        minY=Math.min(minY,point.y);maxY=Math.max(maxY,point.y);
      }
    };
    try{
      for(let step=0;step<=40;step++){
        const p=step/40,e=smoother(p),mid=Math.sin(Math.PI*p);
        model.position.set(base.x,base.y+mid*.035*motionScale,base.z);
        model.rotation.set(base.rx+mid*.025*motionScale,base.ry+lerp(-.10,.10,e)*motionScale,base.rz);
        camera.position.set(original.cameraPosition.x,original.cameraPosition.y,base.cameraZ+lerp(.12,-.06,e)*motionScale);
        camera.updateProjectionMatrix();
        scene.updateMatrixWorld(true);
        camera.updateMatrixWorld(true);
        let sampleMeshes=0;
        model.traverse(node=>{if(node.isMesh){sampleMeshes++;sampleCorners(node,p)}});
        meshCount=Math.max(meshCount,sampleMeshes);
      }
    } finally {
      model.position.copy(original.position);
      model.rotation.copy(original.rotation);
      camera.position.copy(original.cameraPosition);
      camera.updateProjectionMatrix();
      scene.updateMatrixWorld(true);
      camera.updateMatrixWorld(true);
    }
    const r=i.element.getBoundingClientRect();
    return {
      sourceSize:i.stats?.sourceSize||null,
      normalizedScale:i.stats?.normalizedScale||null,
      tuning,
      width:i.width||r.width,height:i.height||r.height,
      aspect:(i.width||r.width)/(i.height||r.height),
      fov:camera.fov,baseCameraZ:base.cameraZ,
      framingRevision:i.element.dataset.modelFramingRevision||null,
      mobileFit:i.element.dataset.mobileLogoFit||null,
      runtimeMobileFit:window.MOVX3D.runtime.mobileLogoFit||null,
      motionScale,meshCount,cornerSamples,
      projection:{minX,maxX,minY,maxY,maxAbsX,maxAbsY,worstProgressX,worstProgressY,
        horizontalReserve:1-maxAbsX,verticalReserve:1-maxAbsY}
    };
  });

  if(!mobileLogo.sourceSize||!mobileLogo.normalizedScale||!mobileLogo.tuning)throw new Error(`v336.1 mobile logo metrics missing ${JSON.stringify(mobileLogo)}`);
  if(mobileLogo.framingRevision!=='v3361-mobile-logo-safe-fit'||mobileLogo.mobileFit!=='v3361'||mobileLogo.runtimeMobileFit!=='v3361')throw new Error(`v336.1 mobile logo fit marker missing ${JSON.stringify(mobileLogo)}`);
  if(mobileLogo.meshCount<1||mobileLogo.cornerSamples<8)throw new Error(`v336.1 projected no physical logo geometry ${JSON.stringify(mobileLogo)}`);
  const projection=mobileLogo.projection;
  if(!(projection.maxAbsX>0&&projection.maxAbsX<=.90))throw new Error(`v336.1 physical logo exceeds safe horizontal NDC: ${JSON.stringify(mobileLogo)}`);
  if(!(projection.maxAbsY>0&&projection.maxAbsY<=.95))throw new Error(`v336.1 physical logo exceeds safe vertical NDC: ${JSON.stringify(mobileLogo)}`);
  if(mobileErrors.length)throw new Error('Critical mobile browser resource errors: '+JSON.stringify(mobileErrors));
  report.mobileLogoFit=mobileLogo;
  await mobile.screenshot({path:'_site/qa-v324-hero-movx-logo-mobile.png',fullPage:false});
  await mobile.close();

  if(errors.length)throw new Error('Critical browser resource errors: '+JSON.stringify(errors));
  fs.writeFileSync('_site/qa-v324-model-report.json',JSON.stringify({status:'passed',framingRevision:'v3361-mobile-logo-safe-fit',choreography:'v331-smooth-handoffs',report},null,2));
  await page.close();
  await browser.close();
  console.log(JSON.stringify({status:'passed',framingRevision:'v3361-mobile-logo-safe-fit',choreography:'v331-smooth-handoffs',slots:Object.keys(expected),mobileLogoMaxAbsX:Number(projection.maxAbsX.toFixed(4)),horizontalReserve:Number(projection.horizontalReserve.toFixed(4)),criticalErrors:[...errors,...mobileErrors]}));
})().catch(async err=>{console.error(err);process.exit(1)});
