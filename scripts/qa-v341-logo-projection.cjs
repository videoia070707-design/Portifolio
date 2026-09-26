const { chromium } = require('playwright');
const fs = require('fs');

(async()=>{
  const browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-webgl','--ignore-gpu-blocklist']});
  const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1,hasTouch:true,isMobile:true});
  const errors=[];
  const captureWarnings=[];
  const critical=/\.(?:glb|gltf|mjs|js|css)(?:\?|$)/i;
  page.on('pageerror',e=>errors.push(`PAGEERROR ${String(e)}`));
  page.on('response',res=>{if(res.status()>=400&&critical.test(res.url()))errors.push(`HTTP ${res.status()} ${res.url()}`)});
  page.on('requestfailed',req=>{if(critical.test(req.url()))errors.push(`REQUEST FAILED ${req.url()} ${req.failure()?.errorText||''}`)});

  await page.goto('http://127.0.0.1:4173/',{waitUntil:'domcontentloaded',timeout:60000});
  await page.waitForFunction(()=>document.documentElement.dataset.modelFramingRevision==='v3361-mobile-logo-safe-fit',null,{timeout:20000});
  await page.waitForFunction(()=>document.documentElement.dataset.modelChoreography==='v331-smooth-handoffs',null,{timeout:20000});

  const logoSelector='[data-model-slot="hero-movx-logo"]';
  await page.evaluate(sel=>{
    const el=document.querySelector(sel); if(!el) return;
    const r=el.getBoundingClientRect();
    window.scrollTo({top:Math.max(0,scrollY+r.top-(innerHeight-r.height)/2),behavior:'instant'});
  },logoSelector);

  await page.waitForFunction(()=>{
    const i=window.MOVX3D?.runtime?.instances?.['hero-movx-logo'];
    return !!(i?.loaded&&i?.v324Tuned&&i?.v3361MobileLogoSafeFit&&i?.element?.dataset?.glbState==='ready');
  },null,{timeout:75000});
  await page.waitForTimeout(700);

  const result=await page.evaluate(()=>{
    const i=window.MOVX3D.runtime.instances['hero-movx-logo'];
    const model=i.model,camera=i.camera,scene=i.scene,base=i.v330Base;
    if(!model||!camera||!scene||!base)throw new Error('physical logo projection prerequisites missing');
    const motionScale=window.MOVX3D.runtime.choreographyMotionScale??1;
    const original={position:model.position.clone(),rotation:model.rotation.clone(),cameraPosition:camera.position.clone()};
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
      for(const x of [box.min.x,box.max.x])for(const y of [box.min.y,box.max.y])for(const z of [box.min.z,box.max.z]){
        point.set(x,y,z).applyMatrix4(node.matrixWorld).project(camera);
        if(!Number.isFinite(point.x)||!Number.isFinite(point.y))continue;
        cornerSamples++;
        const ax=Math.abs(point.x),ay=Math.abs(point.y);
        if(ax>maxAbsX){maxAbsX=ax;worstProgressX=p;}
        if(ay>maxAbsY){maxAbsY=ay;worstProgressY=p;}
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
        model.traverse(node=>{if(node.isMesh){sampleMeshes++;sampleCorners(node,p);}});
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

    return {
      sourceSize:i.stats?.sourceSize||null,
      normalizedScale:i.stats?.normalizedScale||null,
      tuning:i.v324Tuning||null,
      framingRevision:i.element.dataset.modelFramingRevision||null,
      mobileFit:i.element.dataset.mobileLogoFit||null,
      runtimeMobileFit:window.MOVX3D.runtime.mobileLogoFit||null,
      contextLimit:window.MOVX3D.runtime.contextLimit,
      motionScale,meshCount,cornerSamples,
      projection:{minX,maxX,minY,maxY,maxAbsX,maxAbsY,worstProgressX,worstProgressY,horizontalReserve:1-maxAbsX,verticalReserve:1-maxAbsY}
    };
  });

  if(!result.sourceSize||!result.normalizedScale||!result.tuning)throw new Error(`mobile logo metrics missing ${JSON.stringify(result)}`);
  if(result.contextLimit!==2)throw new Error(`mobile context limit must be 2, got ${result.contextLimit}`);
  if(result.framingRevision!=='v3361-mobile-logo-safe-fit'||result.mobileFit!=='v3361'||result.runtimeMobileFit!=='v3361')throw new Error(`mobile logo fit marker missing ${JSON.stringify(result)}`);
  if(result.meshCount<1||result.cornerSamples<8)throw new Error(`projected no physical logo geometry ${JSON.stringify(result)}`);
  if(!(result.projection.maxAbsX>0&&result.projection.maxAbsX<=.90))throw new Error(`physical logo exceeds safe horizontal NDC ${JSON.stringify(result)}`);
  if(!(result.projection.maxAbsY>0&&result.projection.maxAbsY<=.95))throw new Error(`physical logo exceeds safe vertical NDC ${JSON.stringify(result)}`);
  if(errors.length)throw new Error(`critical browser resource errors ${JSON.stringify(errors)}`);

  try{
    await page.screenshot({path:'_site/qa-v341-logo-projection-mobile.png',fullPage:false,animations:'disabled',timeout:8000});
  }catch(error){
    captureWarnings.push(String(error));
  }

  fs.writeFileSync('_site/qa-v341-logo-projection-report.json',JSON.stringify({status:'passed',result,captureWarnings,criticalErrors:errors},null,2));
  await page.close();
  await browser.close();
  console.log(JSON.stringify({status:'passed',maxAbsX:Number(result.projection.maxAbsX.toFixed(4)),maxAbsY:Number(result.projection.maxAbsY.toFixed(4)),captureWarnings:captureWarnings.length}));
})().catch(err=>{console.error(err);process.exit(1);});
