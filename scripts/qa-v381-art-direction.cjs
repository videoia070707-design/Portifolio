const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');

(async()=>{
  const models=fs.readdirSync('_site/models').filter(x=>x.toLowerCase().endsWith('.glb')).sort();
  assert.deepEqual(models,['movx-crt-tv.glb'],'v381 must keep exactly one production GLB');
  const browser=await chromium.launch({headless:true,args:['--no-sandbox','--use-angle=swiftshader','--enable-webgl','--ignore-gpu-blocklist']});
  try{
    const inspect=async page=>page.evaluate(()=>{
      const root=document.documentElement;
      const style=s=>getComputedStyle(document.querySelector(s));
      const rect=s=>{const r=document.querySelector(s).getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height}};
      return {
        marker:root.dataset.v381ArtDirection,
        overflow:root.scrollWidth-innerWidth,
        renderers:document.querySelectorAll('.v322-model-renderer').length,
        activeSlots:window.MOVX3D?.runtime?.activeSlots||[],
        runtimeErrors:window.MOVX3D?.runtime?.errors||[],
        hero:{bg:style('#hero .scene-inner').backgroundColor,radius:style('#hero .scene-inner').borderRadius,chassis:style('#hero .movx-chassis').display,object:rect('#hero .movx-object')},
        portal:{bg:style('#portal .scene-inner').backgroundColor,lines:style('#portal .tunnel-lines').display,frame:style('#portal .tunnel-frame').display},
        work:{grid:style('#work .work-carousel-stage').backgroundImage},
        machine:{bg:style('#machine .scene-inner').backgroundColor,consoleRadius:style('#machine .console311').borderRadius,consoleShadow:style('#machine .console311').boxShadow},
        studio:{bg:style('#studio .scene-inner').backgroundColor},
        people:{bg:style('#people .scene-inner').backgroundColor},
        contact:{bg:style('#contact .scene-inner').backgroundColor},
      };
    });

    const page=await browser.newPage({viewport:{width:1440,height:1000},deviceScaleFactor:1});
    const errors=[];
    page.on('pageerror',e=>errors.push(String(e)));
    page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
    await page.goto('http://127.0.0.1:4173/',{waitUntil:'domcontentloaded',timeout:30000});
    await page.waitForFunction(()=>document.documentElement.dataset.v381ArtDirection==='v381-reference-reset',null,{timeout:12000});
    await page.waitForFunction(()=>document.querySelector('[data-model-slot="boot-tv"]')?.dataset.glbState==='ready',null,{timeout:25000});
    await page.waitForFunction(()=>document.documentElement.dataset.motionIntro==='ready',null,{timeout:12000});
    await page.waitForTimeout(420);
    const s=await inspect(page);
    assert.equal(s.marker,'v381-reference-reset');
    assert.equal(s.renderers,1);assert.deepEqual(s.activeSlots,['boot-tv']);assert.equal(s.runtimeErrors.length,0);assert.ok(s.overflow<=2);
    assert.equal(s.hero.chassis,'none','v381 must remove the fake Scene-02 glass chassis');
    assert.equal(s.hero.radius,'0px','v381 scenes must stop reading as rounded cards');
    assert.equal(s.portal.lines,'none','v381 must remove the decorative tunnel grid');
    assert.equal(s.portal.frame,'none','v381 must remove wireframe tunnel frames');
    assert.equal(s.machine.consoleRadius,'0px','v381 capabilities console must be industrial/editorial, not a rounded dashboard');
    assert.equal(s.machine.consoleShadow,'none','v381 capabilities console must not use dashboard shadow');
    assert.equal(s.hero.bg,'rgb(7, 7, 7)');
    assert.equal(s.portal.bg,'rgb(255, 90, 24)');
    assert.equal(s.studio.bg,'rgb(8, 8, 8)');
    assert.equal(s.contact.bg,'rgb(255, 90, 24)');
    assert.equal(errors.length,0,`desktop page errors: ${errors.join(' | ')}`);

    for(const [name,selector] of [
      ['boot','#boot'],['hero','#hero'],['work','#work .scene-inner'],['machine','#machine'],['people','#people'],['contact','#contact']
    ]){
      const loc=page.locator(selector);await loc.scrollIntoViewIfNeeded();await page.waitForTimeout(260);
      await loc.screenshot({path:`_site/qa-v381-${name}-desktop.png`});
    }
    console.log(JSON.stringify({qa:'v381-art-direction',viewport:'desktop',status:'PASS',state:s}));
    await page.close();

    const mobile=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:1});
    const mobileErrors=[];
    mobile.on('pageerror',e=>mobileErrors.push(String(e)));
    mobile.on('console',m=>{if(m.type()==='error')mobileErrors.push(m.text())});
    await mobile.goto('http://127.0.0.1:4173/',{waitUntil:'domcontentloaded',timeout:30000});
    await mobile.waitForFunction(()=>document.documentElement.dataset.v381ArtDirection==='v381-reference-reset',null,{timeout:12000});
    await mobile.waitForFunction(()=>document.querySelector('[data-model-slot="boot-tv"]')?.dataset.glbState==='ready',null,{timeout:25000});
    await mobile.waitForFunction(()=>document.documentElement.dataset.motionIntro==='ready',null,{timeout:12000});
    await mobile.waitForTimeout(420);
    const m=await inspect(mobile);
    assert.equal(m.marker,'v381-reference-reset');assert.equal(m.renderers,1);assert.deepEqual(m.activeSlots,['boot-tv']);
    assert.ok(m.overflow<=2,`mobile horizontal overflow: ${m.overflow}`);assert.equal(m.runtimeErrors.length,0);
    assert.equal(m.hero.chassis,'none');assert.equal(m.portal.lines,'none');assert.equal(m.portal.frame,'none');
    assert.ok(m.hero.object.left>=-1&&m.hero.object.right<=391,`mobile hero object escaped viewport: ${JSON.stringify(m.hero.object)}`);
    assert.equal(mobileErrors.length,0,`mobile page errors: ${mobileErrors.join(' | ')}`);
    for(const [name,selector] of [['boot','#boot'],['hero','#hero'],['machine','#machine'],['contact','#contact']]){
      const loc=mobile.locator(selector);await loc.scrollIntoViewIfNeeded();await mobile.waitForTimeout(220);
      await loc.screenshot({path:`_site/qa-v381-${name}-mobile.png`});
    }
    console.log(JSON.stringify({qa:'v381-art-direction',viewport:'mobile',status:'PASS',state:m}));
    await mobile.close();
  } finally {await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
