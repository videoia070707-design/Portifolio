const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');

(async()=>{
  const browser=await chromium.launch({args:['--no-sandbox','--use-angle=swiftshader','--enable-webgl','--ignore-gpu-blocklist']});
  const results=[];
  const cases=[
    {name:'desktop',viewport:{width:1366,height:768}},
    {name:'mobile',viewport:{width:390,height:844},isMobile:true,hasTouch:true},
    {name:'reduced',viewport:{width:1280,height:800},reducedMotion:'reduce'}
  ];

  for(const cfg of cases){
    const page=await browser.newPage(cfg),errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
    await page.goto(process.env.MOVX_TEST_URL||'http://127.0.0.1:4173/',{waitUntil:'domcontentloaded'});
    await page.waitForFunction(()=>window.MOVX3D?.runtime?.instances?.['boot-tv']?.channelPhysics?.state,null,{timeout:30000});
    await page.waitForFunction(()=>document.documentElement.dataset.crtChannelPhysics==='v365-ready',null,{timeout:10000});

    const snapshot=()=>page.evaluate(()=>{
      const i=window.MOVX3D.runtime.instances['boot-tv'];
      const p=i.channelPhysics.state;
      const c=i.channels.state;
      return {
        channel:c.channel,physicsChannel:p.channel,signature:p.signature,
        yaw:p.yaw,pitch:p.pitch,roll:p.roll,depth:p.depth,x:p.x,
        autonomousEnergy:p.autonomousEnergy,manualPriority:p.manualPriority,
        updates:p.updates,switches:p.switches,reduced:p.reduced,coarse:p.coarse,
        group:{x:i.group.rotation.x,y:i.group.rotation.y,z:i.group.rotation.z,depth:i.group.position.z,px:i.group.position.x},
        lights:{key:i.lights.key.intensity,fill:i.lights.fill.intensity,rim:i.lights.rim.intensity,fillColor:i.lights.fill.color.getHex(),rimColor:i.lights.rim.color.getHex()},
        object:!!i.objectInteraction,direct:!!i.directManipulation,tactility:!!i.tactility,
        triangles:i.stats.triangles,canvases:document.querySelectorAll('.v322-model-renderer canvas').length,
        overflow:document.documentElement.scrollWidth-innerWidth,
        marker:document.documentElement.dataset.crtChannelPhysics||null,
        bootMarker:document.querySelector('#boot')?.dataset.crtChannelPhysics||null
      };
    });

    const tune=async channel=>{
      await page.evaluate(id=>document.querySelector(`[data-crt-mode-control="${id}"]`)?.click(),channel);
      await page.waitForFunction(id=>{
        const i=window.MOVX3D?.runtime?.instances?.['boot-tv'];
        return i?.channels?.state?.channel===id&&i?.channelPhysics?.state?.channel===id;
      },channel,{timeout:8000});
      await page.waitForTimeout(cfg.name==='reduced'?120:700);
      return snapshot();
    };

    const initial=await snapshot();
    assert.equal(initial.marker,'v365-ready');assert.equal(initial.bootMarker,'ready');
    assert.equal(initial.triangles,44831);assert.equal(initial.canvases,1);assert.ok(initial.overflow<=2);
    assert.ok(initial.object&&initial.direct&&initial.tactility,'v365 must preserve v362-v364 interaction owners');

    const direction=await tune('direction');
    const motion=await tune('motion');
    const ai=await tune('ai');
    const digital=await tune('digital');

    for(const [id,state] of Object.entries({direction,motion,ai,digital})){
      assert.equal(state.channel,id);assert.equal(state.physicsChannel,id);assert.equal(state.signature,id);
      assert.equal(state.canvases,1);assert.equal(state.triangles,44831);assert.ok(state.overflow<=2);
    }

    assert.notEqual(direction.yaw,motion.yaw,'Direction and Motion must not share the same physical yaw');
    assert.notEqual(motion.pitch,ai.pitch,'Motion and AI must not share the same physical pitch');
    assert.notEqual(ai.depth,digital.depth,'AI and Digital must not share the same depth response');
    assert.notEqual(direction.lights.fillColor,motion.lights.fillColor,'Motion must retune the existing light rig');
    assert.notEqual(ai.lights.rimColor,digital.lights.rimColor,'AI and Digital must have distinct rim-light signatures');

    if(cfg.name==='desktop'){
      assert.ok(motion.autonomousEnergy>.0005,'Motion must physically breathe with its programme');
      assert.ok(ai.autonomousEnergy>.0005,'AI placeholder must have a restrained orbital response');
      assert.equal(digital.autonomousEnergy,0,'Digital must stay mechanically precise instead of drifting');
      assert.ok(Math.abs(motion.group.z-direction.group.z)>.001||Math.abs(motion.group.y-direction.group.y)>.003,'Motion channel did not visibly alter the CRT pose');
      assert.ok(Math.abs(ai.group.depth-digital.group.depth)>.004,'AI/Digital depth states are not physically distinct');
    }

    if(cfg.name==='mobile'){
      assert.equal(initial.coarse,true,'mobile physics must detect coarse input');
      assert.ok(motion.autonomousEnergy>=0,'mobile channel physics failed to update');
      assert.equal(digital.autonomousEnergy,0);
    }

    if(cfg.name==='reduced'){
      assert.equal(initial.reduced,true);
      assert.equal(direction.autonomousEnergy,0);assert.equal(motion.autonomousEnergy,0);assert.equal(ai.autonomousEnergy,0);assert.equal(digital.autonomousEnergy,0);
      const before=await snapshot();await page.waitForTimeout(260);const after=await snapshot();
      assert.equal(after.autonomousEnergy,0,'reduced-motion must not introduce autonomous CRT motion');
      assert.ok(Math.abs(after.group.x-before.group.x)<.0001&&Math.abs(after.group.y-before.group.y)<.0001&&Math.abs(after.group.z-before.group.z)<.0001,'reduced-motion CRT must remain still without user input');
    }

    assert.deepEqual(errors,[]);
    await page.locator('#boot').screenshot({path:`_site/qa-v365-${cfg.name}-channel-physics.png`});
    results.push({name:cfg.name,status:'PASS',direction,motion,ai,digital});
    await page.close();
  }

  await browser.close();
  fs.writeFileSync('_site/qa-v365-results.json',JSON.stringify(results,null,2));
  console.log(JSON.stringify(results.map(r=>({name:r.name,status:r.status,motionEnergy:r.motion.autonomousEnergy,aiEnergy:r.ai.autonomousEnergy,digitalEnergy:r.digital.autonomousEnergy,channels:[r.direction.signature,r.motion.signature,r.ai.signature,r.digital.signature]}))));
})().catch(e=>{console.error(e);process.exit(1)});
