const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');

(async()=>{
  const models=fs.readdirSync('_site/models').filter(x=>x.toLowerCase().endsWith('.glb')).sort();
  assert.deepEqual(models,['movx-crt-tv.glb'],'v383 must keep exactly one production GLB');
  const browser=await chromium.launch({headless:true,args:['--no-sandbox','--use-angle=swiftshader','--enable-webgl','--ignore-gpu-blocklist']});
  try{
    const inspect=async page=>page.evaluate(()=>{
      const $=s=>document.querySelector(s);
      const style=(s,pseudo=null)=>getComputedStyle($(s),pseudo);
      const root=document.documentElement;
      const people=$('#people .people-visual img');
      return {
        marker:root.dataset.v383Deplaceholder,
        overflow:root.scrollWidth-innerWidth,
        renderers:document.querySelectorAll('.v322-model-renderer').length,
        activeSlots:window.MOVX3D?.runtime?.activeSlots||[],
        runtimeErrors:window.MOVX3D?.runtime?.errors||[],
        portal:{
          perspective:style('#portal [data-model-slot="x-portal"]').perspective,
          depth:style('#portal .v316-depth-field').display,
          frame:style('#portal .v316-tunnel-frame').display,
          xBg:style('#portal .v316-x-core','::before').backgroundColor,
          xShadow:style('#portal .v316-x-core','::before').boxShadow,
        },
        playground:{
          cursor:style('#playground .float.cursor').display,
          cassetteRadius:style('#playground .float.cassette').borderRadius,
          cassetteShadow:style('#playground .float.cassette').boxShadow,
          cameraRadius:style('#playground .float.camera').borderRadius,
          cdRadius:style('#playground .float.cd').borderRadius,
          windowRadius:style('#playground .float.window').borderRadius,
          cassetteLabel:style('#playground .float.cassette','::before').content,
          cameraLabel:style('#playground .float.camera','::before').content,
          formLabel:style('#playground .float.cube','::before').content,
        },
        studio:{
          radius:style('#studio [data-model-slot="spatial-studio"]').borderRadius,
          shadow:style('#studio [data-model-slot="spatial-studio"]').boxShadow,
          perspective:style('#studio [data-model-slot="spatial-studio"]').perspective,
          wall:style('#studio .studio-wall').display,
          desk:style('#studio .studio-desk').display,
          chair:style('#studio .studio-chair').display,
          word:style('#studio .studio-stage','::before').content,
          copyBg:style('#studio .studio-copy').backgroundColor,
        },
        people:{
          complete:!!people?.complete,
          naturalWidth:people?.naturalWidth||0,
          transform:people?style('#people .people-visual img').transform:'none',
          objectPosition:people?style('#people .people-visual img').objectPosition:'',
        }
      };
    });

    const open=async opts=>{
      const p=await browser.newPage(opts);const errors=[];
      p.on('pageerror',e=>errors.push(String(e)));
      p.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
      await p.goto('http://127.0.0.1:4173/',{waitUntil:'domcontentloaded',timeout:30000});
      await p.waitForFunction(()=>document.documentElement.dataset.v383Deplaceholder==='v383-graphic-world',null,{timeout:12000});
      await p.waitForFunction(()=>document.querySelector('[data-model-slot="boot-tv"]')?.dataset.glbState==='ready',null,{timeout:25000});
      await p.waitForSelector('#portal .v316-x-core',{state:'attached',timeout:12000});
      await p.waitForFunction(()=>{const i=document.querySelector('#people .people-visual img');return i?.complete&&i.naturalWidth>0},null,{timeout:12000});
      return {p,errors};
    };

    const {p:page,errors}=await open({viewport:{width:1440,height:1000},deviceScaleFactor:1});
    const d=await inspect(page);
    assert.equal(d.marker,'v383-graphic-world');
    assert.equal(d.renderers,1);assert.deepEqual(d.activeSlots,['boot-tv']);assert.equal(d.runtimeErrors.length,0);assert.ok(d.overflow<=2);
    assert.equal(d.portal.perspective,'none');assert.equal(d.portal.depth,'none');assert.equal(d.portal.frame,'none');assert.equal(d.portal.xBg,'rgb(7, 7, 7)');assert.equal(d.portal.xShadow,'none');
    assert.equal(d.playground.cursor,'none');
    for(const value of [d.playground.cassetteRadius,d.playground.cameraRadius,d.playground.cdRadius,d.playground.windowRadius])assert.equal(value,'0px');
    assert.equal(d.playground.cassetteShadow,'none');
    assert.ok(d.playground.cassetteLabel.includes('IDEAS'));assert.ok(d.playground.cameraLabel.includes('CAPTURE'));assert.ok(d.playground.formLabel.includes('FORM'));
    assert.equal(d.studio.radius,'0px');assert.equal(d.studio.shadow,'none');assert.equal(d.studio.perspective,'none');assert.equal(d.studio.wall,'none');assert.equal(d.studio.desk,'none');assert.equal(d.studio.chair,'none');assert.ok(d.studio.word.includes('STUDIO'));
    assert.equal(d.people.complete,true);assert.ok(d.people.naturalWidth>500);assert.notEqual(d.people.transform,'none');
    assert.equal(errors.length,0,`desktop page errors: ${errors.join(' | ')}`);
    for(const [name,sel] of [['portal','#portal'],['playground','#playground'],['studio','#studio'],['people','#people']]){
      const loc=page.locator(sel);await loc.scrollIntoViewIfNeeded();await page.waitForTimeout(1100);await loc.screenshot({path:`_site/qa-v383-${name}-desktop.png`});
    }
    console.log(JSON.stringify({qa:'v383-deplaceholder',viewport:'desktop',status:'PASS',state:d}));
    await page.close();

    const {p:mobile,errors:mobileErrors}=await open({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:1});
    const m=await inspect(mobile);
    assert.equal(m.marker,'v383-graphic-world');assert.equal(m.renderers,1);assert.deepEqual(m.activeSlots,['boot-tv']);assert.equal(m.runtimeErrors.length,0);assert.ok(m.overflow<=2);
    assert.equal(m.portal.depth,'none');assert.equal(m.portal.frame,'none');assert.equal(m.playground.cursor,'none');assert.equal(m.studio.wall,'none');assert.equal(m.studio.radius,'0px');
    assert.equal(m.people.complete,true);assert.ok(m.people.naturalWidth>500);assert.notEqual(m.people.transform,'none');
    assert.equal(mobileErrors.length,0,`mobile page errors: ${mobileErrors.join(' | ')}`);
    for(const [name,sel] of [['portal','#portal'],['playground','#playground'],['studio','#studio'],['people','#people']]){
      const loc=mobile.locator(sel);await loc.scrollIntoViewIfNeeded();await mobile.waitForTimeout(1100);await loc.screenshot({path:`_site/qa-v383-${name}-mobile.png`});
    }
    console.log(JSON.stringify({qa:'v383-deplaceholder',viewport:'mobile',status:'PASS',state:m}));
    await mobile.close();
  } finally {await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
