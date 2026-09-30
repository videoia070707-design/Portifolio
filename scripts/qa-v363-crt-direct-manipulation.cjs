const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');

(async()=>{
  const browser=await chromium.launch({args:['--no-sandbox','--use-angle=swiftshader','--enable-webgl','--ignore-gpu-blocklist']});
  const results=[];
  for(const cfg of [
    {name:'desktop',viewport:{width:1366,height:768}},
    {name:'mobile',viewport:{width:390,height:844},isMobile:true,hasTouch:true},
    {name:'reduced',viewport:{width:1280,height:800},reducedMotion:'reduce'}
  ]){
    const page=await browser.newPage(cfg),errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
    await page.goto(process.env.MOVX_TEST_URL||'http://127.0.0.1:4173/',{waitUntil:'domcontentloaded'});
    await page.waitForFunction(()=>window.MOVX3D?.runtime?.instances?.['boot-tv']?.directManipulation?.state,null,{timeout:30000});
    await page.waitForFunction(()=>document.documentElement.dataset.crtDirect==='v363-ready',null,{timeout:10000});

    const snapshot=()=>page.evaluate(()=>{
      const i=window.MOVX3D.runtime.instances['boot-tv'],d=i.directManipulation.state;
      return {
        channel:i.channels.state.channel,art:i.channels.state.art,mobile:i.channels.state.mobile,
        amount:i.channels.state.amount,phase:i.channels.state.phase,paused:i.channels.state.paused,
        screenDrags:d.screenDrags,dialDrags:d.dialDrags,lastAction:d.lastAction,currentZ:d.currentZ,
        triangles:i.stats.triangles,canvases:document.querySelectorAll('.v322-model-renderer canvas').length,
        overflow:document.documentElement.scrollWidth-innerWidth,
        directMarker:document.documentElement.dataset.crtDirect||null,
        help:document.querySelector('.crt-program-help')?.textContent||''
      };
    });
    const choose=async channel=>{
      await page.locator(`[data-crt-mode-control="${channel}"]`).click();
      await page.waitForFunction(ch=>window.MOVX3D.runtime.instances['boot-tv'].channels.state.channel===ch,channel,{timeout:7000,polling:'raf'});
      await page.waitForTimeout(120);
    };
    const points=()=>page.evaluate(async()=>{
      const THREE=await import('./vendor/three.module.js');
      const i=window.MOVX3D.runtime.instances['boot-tv'];
      const canvasRect=i.canvas.getBoundingClientRect();
      const project=obj=>{obj.geometry.computeBoundingBox();const c=obj.geometry.boundingBox.getCenter(new THREE.Vector3());obj.localToWorld(c);c.project(i.camera);return{x:canvasRect.x+(c.x+1)*canvasRect.width/2,y:canvasRect.y+(1-c.y)*canvasRect.height/2}};
      const visiblePoint=(obj,center)=>{
        const ray=new THREE.Raycaster(),ndc=new THREE.Vector2();
        const offsets=[0,-5,5,-10,10,-15,15,-20,20,-26,26,-34,34,-42,42];
        for(const dy of offsets){for(const dx of offsets){
          const x=center.x+dx,y=center.y+dy;
          ndc.set((x-canvasRect.x)/canvasRect.width*2-1,-(y-canvasRect.y)/canvasRect.height*2+1);
          ray.setFromCamera(ndc,i.camera);
          const hit=ray.intersectObject(i.model,true)[0]?.object||null;
          if(hit===obj)return{x,y,visible:true,hit:hit.name};
        }}
        return{x:center.x,y:center.y,visible:false,hit:null};
      };
      const screen=project(i.channels.screen),knobObj=i.model.getObjectByName('tripo_part_8'),knobCenter=project(knobObj);
      return {screen,knob:visiblePoint(knobObj,knobCenter),knobCenter};
    });
    const drag=async(from,to)=>{
      await page.mouse.move(from.x,from.y);await page.mouse.down();
      await page.mouse.move(to.x,to.y,{steps:6});await page.mouse.up();await page.waitForTimeout(160);
    };
    const settleKnobPoint=async()=>{
      let p=null;
      for(let attempt=0;attempt<5;attempt++){
        p=await points();
        if(!p.knob.visible){await page.waitForTimeout(80);continue;}
        const frame=await page.evaluate(()=>Number(document.querySelector('#boot')?.dataset.v371Frame||0));
        await page.mouse.move(p.knob.x,p.knob.y,{steps:4});
        await page.waitForFunction(previous=>Number(document.querySelector('#boot')?.dataset.v371Frame||0)>previous,frame,{timeout:4000,polling:'raf'}).catch(()=>{});
        p=await points();
        if(p.knob.visible)return p.knob;
      }
      assert.fail(`selector has no converged visible ray-hit near ${JSON.stringify(p?.knobCenter||null)}`);
    };
    const beginKnobGesture=async()=>{
      let point=null;
      for(let attempt=1;attempt<=6;attempt++){
        point=await settleKnobPoint();
        await page.mouse.move(point.x,point.y,{steps:2});
        await page.mouse.down();
        try{
          await page.waitForFunction(()=>{const d=window.MOVX3D?.runtime?.instances?.['boot-tv']?.directManipulation?.state;return d?.active===true&&d?.kind==='knob'},null,{timeout:1100,polling:'raf'});
          return {point,attempts:attempt};
        }catch{
          await page.mouse.up();
          await page.waitForFunction(()=>!window.MOVX3D?.runtime?.instances?.['boot-tv']?.directManipulation?.state?.active,null,{timeout:1200,polling:'raf'}).catch(()=>{});
        }
      }
      assert.fail(`real selector never captured pointerdown after reprojection: ${JSON.stringify(point)}`);
    };

    const initial=await snapshot();
    assert.equal(initial.triangles,44831);assert.equal(initial.canvases,1);assert.ok(initial.overflow<=2);assert.equal(initial.directMarker,'v363-ready');

    if(cfg.name==='desktop'){
      let p=await points();
      await choose('direction');const dir0=await snapshot();
      await drag(p.screen,{x:p.screen.x+95,y:p.screen.y});
      const dir1=await snapshot();assert.notEqual(dir1.art,dir0.art,'dragging real CRT screen must scrub direction artwork');assert.equal(dir1.lastAction,'direction-scrub');

      await choose('motion');p=await points();const mot0=await snapshot();
      await drag(p.screen,{x:p.screen.x+120,y:p.screen.y+4});
      const mot1=await snapshot();assert.notEqual(mot1.phase,mot0.phase,'dragging screen must scrub motion phase');assert.equal(mot1.lastAction,'motion-scrub');assert.equal(mot1.paused,mot0.paused,'motion playback state must restore after scrub');

      await choose('ai');p=await points();const ai0=await snapshot();
      await drag(p.screen,{x:p.screen.x+3,y:p.screen.y-105});
      const ai1=await snapshot();assert.notEqual(ai1.amount,ai0.amount,'vertical screen drag must deform generative channel');assert.equal(ai1.lastAction,'ai-shape');

      await choose('digital');p=await points();const dig0=await snapshot();
      await drag(p.screen,{x:p.screen.x+92,y:p.screen.y});
      const dig1=await snapshot();assert.notEqual(dig1.mobile,dig0.mobile,'screen drag must switch digital format');assert.equal(dig1.lastAction,'digital-format');

      /* Re-enter DIREÇÃO so one real detent has a deterministic semantic target.
         The gesture still has to be captured by tripo_part_8 through v363 raycast. */
      await choose('direction');
      const dial0=await snapshot(),capture=await beginKnobGesture();
      const target=await page.evaluate(()=>{const d=window.MOVX3D.runtime.instances['boot-tv'].directManipulation.state,r=Math.max(34,Math.hypot(d.startX-d.knobCenterX,d.startY-d.knobCenterY)),a=d.startAngle+.82;return{x:d.knobCenterX+Math.cos(a)*r,y:d.knobCenterY+Math.sin(a)*r}});
      await page.mouse.move(target.x,target.y,{steps:8});await page.mouse.up();
      await page.waitForFunction(previous=>window.MOVX3D.runtime.instances['boot-tv'].directManipulation.state.dialDrags>previous,dial0.dialDrags,{timeout:7000,polling:'raf'});
      const dial1=await snapshot();assert.ok(dial1.dialDrags>dial0.dialDrags,'dragging selector must tune a channel');assert.equal(dial1.lastAction,'dial-tune');
      assert.equal(dial1.channel,'motion','one real CRT selector detent from DIREÇÃO must tune MOTION');
      assert.ok(capture.attempts<=6,'selector capture exceeded bounded retry contract');
      assert.ok(/Arraste/.test(dial1.help),'direct manipulation help must explain the physical gesture');
    }

    if(cfg.name==='mobile'){
      await choose('direction');
      const before=await snapshot();
      await page.locator('.crt-program-controls button').first().click();
      await page.waitForFunction(a=>window.MOVX3D.runtime.instances['boot-tv'].channels.state.art!==a,before.art,{timeout:7000,polling:'raf'});
      const after=await snapshot();assert.notEqual(after.art,before.art,'touch controls must remain functional without gesture capture');assert.ok(after.help.length>20);
    }

    if(cfg.name==='reduced'){
      await choose('motion');const before=await snapshot();const p=await points();
      await drag(p.screen,{x:p.screen.x+90,y:p.screen.y});
      const after=await snapshot();assert.notEqual(after.phase,before.phase,'reduced motion must retain manual scrub');assert.equal(after.paused,before.paused);
    }

    assert.deepEqual(errors,[]);
    await page.locator('#boot').screenshot({path:`_site/qa-v363-${cfg.name}-direct.png`});
    results.push({name:cfg.name,status:'PASS',state:await snapshot()});await page.close();
  }
  await browser.close();
  fs.writeFileSync('_site/qa-v363-results.json',JSON.stringify(results,null,2));
  console.log(JSON.stringify(results.map(r=>({name:r.name,status:r.status,screenDrags:r.state.screenDrags,dialDrags:r.state.dialDrags,lastAction:r.state.lastAction}))));
})().catch(e=>{console.error(e);process.exit(1)});
