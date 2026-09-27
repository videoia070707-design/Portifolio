const {chromium}=require('playwright');
const assert=require('node:assert/strict');

(async()=>{
  const browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-webgl','--ignore-gpu-blocklist']});
  try{
    for(const cfg of [
      {name:'desktop',viewport:{width:1440,height:1000},minHeightRatio:1.45},
      {name:'mobile',viewport:{width:390,height:844},minHeightRatio:1.24},
    ]){
      const page=await browser.newPage({viewport:cfg.viewport,deviceScaleFactor:1});
      const errors=[];page.on('pageerror',e=>errors.push(String(e)));
      await page.goto('http://127.0.0.1:4173/',{waitUntil:'domcontentloaded',timeout:30000});
      await page.waitForFunction(()=>document.documentElement.dataset.motionChoreoReady==='true',null,{timeout:15000});
      await page.waitForFunction(()=>document.querySelector('[data-model-slot="boot-tv"]')?.dataset.glbState==='ready',null,{timeout:30000});
      await page.waitForFunction(()=>document.documentElement.dataset.motionIntro==='ready',null,{timeout:10000});

      const before=await page.evaluate(()=>{
        const root=document.documentElement;
        const boot=document.querySelector('#boot');
        const inner=boot.querySelector('.scene-inner');
        const wrap=boot.querySelector('.crt-wrap');
        const copy=boot.querySelector('.boot-copy');
        return {
          choreography:root.dataset.motionChoreo,
          reduced:root.dataset.motionChoreoReduced,
          phase:boot.dataset.v354Phase,
          bootHeight:boot.getBoundingClientRect().height,
          vh:innerHeight,
          sticky:getComputedStyle(inner).position,
          innerTop:getComputedStyle(inner).top,
          wrapTransform:getComputedStyle(wrap).transform,
          copyOpacity:parseFloat(getComputedStyle(copy).opacity),
          cue:!!boot.querySelector('.boot-scroll-cue-v354'),
          rendererCount:document.querySelectorAll('.v322-model-renderer').length,
          laterStates:[...document.querySelectorAll('[data-model-slot]')].filter(el=>el.dataset.modelSlot!=='boot-tv').map(el=>el.dataset.glbState),
          overflow:root.scrollWidth-root.clientWidth,
          runtimeErrors:window.MOVX3D?.runtime?.errors||[],
        };
      });
      assert.equal(before.choreography,'v354-boot-scroll');
      assert.equal(before.reduced,'false');
      assert.ok(before.bootHeight>=before.vh*cfg.minHeightRatio,`boot choreography too short: ${before.bootHeight}/${before.vh}`);
      assert.equal(before.sticky,'sticky');
      assert.equal(before.cue,true);
      assert.equal(before.rendererCount,1,'only CRT renderer may be active');
      assert.ok(before.laterStates.every(x=>x==='deferred'),'later 3D slot escaped deferred gate');
      assert.equal(before.runtimeErrors.length,0,'3D runtime errors: '+JSON.stringify(before.runtimeErrors));
      assert.ok(before.overflow<=2,'horizontal overflow before scroll');

      await page.evaluate(()=>{
        const boot=document.querySelector('#boot');
        const travel=Math.max(1,boot.offsetHeight-innerHeight);
        scrollTo({top:boot.offsetTop+travel*.66,behavior:'instant'});
      });
      await page.waitForFunction(()=>parseFloat(document.documentElement.dataset.motionChoreoProgress||'0')>.54,null,{timeout:5000});
      await page.waitForTimeout(350);

      const mid=await page.evaluate(()=>{
        const root=document.documentElement;
        const boot=document.querySelector('#boot');
        const wrap=boot.querySelector('.crt-wrap');
        const copy=boot.querySelector('.boot-copy');
        const cue=boot.querySelector('.boot-scroll-cue-v354');
        return {
          progress:parseFloat(root.dataset.motionChoreoProgress||'0'),
          phase:boot.dataset.v354Phase,
          wrapTransform:getComputedStyle(wrap).transform,
          copyOpacity:parseFloat(getComputedStyle(copy).opacity),
          cueOpacity:parseFloat(getComputedStyle(cue).opacity),
          crtProgress:parseFloat(getComputedStyle(root).getPropertyValue('--crt-progress')),
          rendererCount:document.querySelectorAll('.v322-model-renderer').length,
          heroState:document.querySelector('[data-model-slot="hero-movx-logo"]')?.dataset.glbState,
          overflow:root.scrollWidth-root.clientWidth,
        };
      });
      assert.ok(mid.progress>.54,'scroll choreography progress did not advance');
      assert.notEqual(mid.wrapTransform,before.wrapTransform,'CRT wrapper did not change during choreography');
      assert.ok(mid.copyOpacity<.86,'boot copy did not phase out');
      assert.ok(mid.cueOpacity<.25,'scroll cue did not clear after engagement');
      assert.ok(mid.crtProgress>.5,'scroll progress was not handed to 3D runtime');
      assert.equal(mid.rendererCount,1,'later 3D renderer activated during boot choreography');
      assert.equal(mid.heroState,'deferred');
      assert.ok(mid.overflow<=2,'horizontal overflow after choreography');
      assert.equal(errors.length,0,'page errors: '+errors.join(' | '));

      await page.screenshot({path:`_site/qa-v354-boot-choreo-${cfg.name}.png`,fullPage:false});
      console.log(JSON.stringify({qa:'v354-boot-choreo',viewport:cfg.name,status:'PASS',before,mid}));
      await page.close();
    }

    const reducedPage=await browser.newPage({viewport:{width:1280,height:800},reducedMotion:'reduce'});
    await reducedPage.goto('http://127.0.0.1:4173/',{waitUntil:'domcontentloaded',timeout:30000});
    await reducedPage.waitForFunction(()=>document.documentElement.dataset.motionChoreoReady==='true',null,{timeout:10000});
    const reduced=await reducedPage.evaluate(()=>{
      const root=document.documentElement;
      const boot=document.querySelector('#boot');
      const inner=boot.querySelector('.scene-inner');
      return {
        reduced:root.dataset.motionChoreoReduced,
        phase:boot.dataset.v354Phase,
        bootHeight:boot.getBoundingClientRect().height,
        vh:innerHeight,
        sticky:getComputedStyle(inner).position,
        cueDisplay:getComputedStyle(boot.querySelector('.boot-scroll-cue-v354')).display,
      };
    });
    assert.equal(reduced.reduced,'true');
    assert.equal(reduced.phase,'static');
    assert.notEqual(reduced.sticky,'sticky');
    assert.equal(reduced.cueDisplay,'none');
    assert.ok(reduced.bootHeight<reduced.vh*1.2,'reduced-motion retained extended scroll choreography');
    await reducedPage.close();
  } finally {await browser.close()}
})().catch(err=>{console.error(err);process.exit(1)});
