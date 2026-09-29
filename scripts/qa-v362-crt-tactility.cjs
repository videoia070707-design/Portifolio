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
    await page.waitForFunction(()=>window.MOVX3D?.runtime?.instances?.['boot-tv']?.tactility?.state,null,{timeout:30000});
    await page.waitForFunction(()=>document.documentElement.dataset.crtTactility==='v362-ready',null,{timeout:10000});
    const state=()=>page.evaluate(()=>{
      const i=window.MOVX3D.runtime.instances['boot-tv'],t=i.tactility.state;
      return {
        channel:i.channels.state.channel,
        art:i.channels.state.art,
        pixels:i.channels.canvas.toDataURL(),
        hover:t.hover,
        pointerSamples:t.pointerSamples,
        visualUpdates:t.visualUpdates,
        shiftX:t.shiftX,shiftY:t.shiftY,
        knobKick:t.knobKick,
        reduced:t.reduced,
        coarse:t.coarse,
        emissive:i.channels.screen.material.emissiveIntensity,
        baseEmissive:t.baseEmissive,
        triangles:i.stats.triangles,
        canvases:document.querySelectorAll('.v322-model-renderer canvas').length,
        overflow:document.documentElement.scrollWidth-innerWidth
      };
    });

    const initial=await state();
    assert.equal(initial.triangles,44831);
    assert.equal(initial.canvases,1);
    assert.ok(initial.overflow<=2);

    if(cfg.name==='desktop'){
      const point=await page.evaluate(async()=>{
        const THREE=await import('./vendor/three.module.js');
        const i=window.MOVX3D.runtime.instances['boot-tv'],s=i.channels.screen;
        s.geometry.computeBoundingBox();
        const b=s.geometry.boundingBox,c=b.getCenter(new THREE.Vector3());
        s.localToWorld(c);c.project(i.camera);
        const r=i.canvas.getBoundingClientRect();
        return {x:r.x+(c.x+1)*r.width/2,y:r.y+(1-c.y)*r.height/2};
      });
      await page.mouse.move(point.x,point.y);
      await page.waitForFunction(()=>window.MOVX3D.runtime.instances['boot-tv'].tactility.state.hover>.35,null,{timeout:5000,polling:'raf'});
      await page.waitForTimeout(120);
      const hovered=await state();
      assert.ok(hovered.pointerSamples>initial.pointerSamples,'real screen must receive pointer samples');
      assert.ok(hovered.visualUpdates>initial.visualUpdates,'screen texture must visibly respond to hover');
      if(hovered.baseEmissive!==null)assert.ok(hovered.emissive>hovered.baseEmissive,'glass emissive response missing');
      assert.notEqual(hovered.pixels,initial.pixels,'hover must alter the rendered screen response');

      await page.locator('[data-crt-mode-control="motion"]').click();
      await page.waitForFunction(()=>window.MOVX3D.runtime.instances['boot-tv'].tactility.state.knobKick>.15,null,{timeout:3000,polling:'raf'});
      await page.waitForFunction(()=>window.MOVX3D.runtime.instances['boot-tv'].channels.state.channel==='motion');
      const tuned=await state();
      assert.equal(tuned.channel,'motion');
      assert.ok(tuned.knobKick>.15,'selector must receive physical kick feedback');

      await page.mouse.move(4,4);
      await page.waitForFunction(()=>window.MOVX3D.runtime.instances['boot-tv'].tactility.state.hover<.08,null,{timeout:5000,polling:'raf'});
    }

    if(cfg.name==='mobile'){
      const direction=page.locator('[data-crt-mode-control="direction"]');
      await direction.click();
      const before=await state();
      await page.locator('.crt-program-controls button').first().click();
      await page.waitForFunction(a=>window.MOVX3D.runtime.instances['boot-tv'].channels.state.art!==a,before.art,{timeout:5000});
      const after=await state();
      assert.notEqual(after.art,before.art,'touch-accessible channel action must remain live');
      assert.equal(after.coarse,true);
    }

    if(cfg.name==='reduced'){
      assert.equal(initial.reduced,true);
      const point=await page.evaluate(async()=>{
        const THREE=await import('./vendor/three.module.js');
        const i=window.MOVX3D.runtime.instances['boot-tv'],s=i.channels.screen;
        s.geometry.computeBoundingBox();const c=s.geometry.boundingBox.getCenter(new THREE.Vector3());
        s.localToWorld(c);c.project(i.camera);const r=i.canvas.getBoundingClientRect();
        return {x:r.x+(c.x+1)*r.width/2,y:r.y+(1-c.y)*r.height/2};
      });
      await page.mouse.move(point.x,point.y);await page.waitForTimeout(120);
      const calm=await state();
      assert.equal(calm.shiftX,0);assert.equal(calm.shiftY,0);
    }

    assert.deepEqual(errors,[]);
    await page.locator('#boot').screenshot({path:`_site/qa-v362-${cfg.name}-tactility.png`});
    results.push({name:cfg.name,status:'PASS',state:await state()});
    await page.close();
  }
  await browser.close();
  fs.writeFileSync('_site/qa-v362-results.json',JSON.stringify(results,null,2));
  console.log(JSON.stringify(results.map(r=>({name:r.name,status:r.status,visualUpdates:r.state.visualUpdates}))));
})().catch(e=>{console.error(e);process.exit(1)});
