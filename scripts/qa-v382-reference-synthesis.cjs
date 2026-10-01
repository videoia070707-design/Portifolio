const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');

(async()=>{
  const models=fs.readdirSync('_site/models').filter(x=>x.toLowerCase().endsWith('.glb')).sort();
  assert.deepEqual(models,['movx-crt-tv.glb'],'v382 must keep exactly one production GLB');
  const browser=await chromium.launch({headless:true,args:['--no-sandbox','--use-angle=swiftshader','--enable-webgl','--ignore-gpu-blocklist']});
  try{
    const inspect=async page=>page.evaluate(()=>{
      const $=s=>document.querySelector(s);const cs=s=>getComputedStyle($(s));
      const rr=s=>{const r=$(s).getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height}};
      const img=$('#people .people-visual img');
      return {
        marker:document.documentElement.dataset.v382ReferenceSynthesis,
        overflow:document.documentElement.scrollWidth-innerWidth,
        renderers:document.querySelectorAll('.v322-model-renderer').length,
        activeSlots:window.MOVX3D?.runtime?.activeSlots||[],
        runtimeErrors:window.MOVX3D?.runtime?.errors||[],
        boot:{wrapTop:cs('#boot .crt-wrap').top},
        hero:{plaque:cs('#hero .v315-logo-plaque').display,status:cs('#hero .v315-logo-status').display},
        machine:{
          slotRadius:cs('#machine [data-model-slot="creative-machine"]').borderRadius,
          slotShadow:cs('#machine [data-model-slot="creative-machine"]').boxShadow,
          slotBg:cs('#machine [data-model-slot="creative-machine"]').backgroundColor,
          unitRadius:cs('#machine .console-unit').borderRadius,
          unitShadow:cs('#machine .console-unit').boxShadow,
          unitBg:cs('#machine .console-unit').backgroundColor,
          screenRadius:cs('#machine .console-unit .screen').borderRadius,
          knobs:cs('#machine .knobs').display,
        },
        people:{
          src:img?.getAttribute('src')||'',complete:!!img?.complete,naturalWidth:img?.naturalWidth||0,
          visual:rr('#people .people-visual'),image:rr('#people .people-visual img'),
          position:cs('#people .people-visual img').position,opacity:cs('#people .people-visual img').opacity,
          objectFit:cs('#people .people-visual img').objectFit,
        },
        contact:{
          window:rr('#contact [data-model-slot="closing-window"]'),landscape:rr('#contact .contact-window .landscape'),
          radius:cs('#contact [data-model-slot="closing-window"]').borderRadius,
          landscapeRadius:cs('#contact .contact-window .landscape').borderRadius,
        },
      };
    });

    const makePage=async opts=>{
      const p=await browser.newPage(opts);const errors=[];
      p.on('pageerror',e=>errors.push(String(e)));
      p.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
      await p.goto('http://127.0.0.1:4173/',{waitUntil:'domcontentloaded',timeout:30000});
      await p.waitForFunction(()=>document.documentElement.dataset.v382ReferenceSynthesis==='v382-world-pass',null,{timeout:12000});
      await p.waitForFunction(()=>document.querySelector('[data-model-slot="boot-tv"]')?.dataset.glbState==='ready',null,{timeout:25000});
      await p.waitForFunction(()=>document.documentElement.dataset.motionIntro==='ready',null,{timeout:12000});
      await p.waitForFunction(()=>{const i=document.querySelector('#people .people-visual img');return i?.complete&&i.naturalWidth>0},null,{timeout:12000});
      return {p,errors};
    };

    const {p:page,errors}=await makePage({viewport:{width:1440,height:1000},deviceScaleFactor:1});
    const d=await inspect(page);
    assert.equal(d.marker,'v382-world-pass');assert.equal(d.renderers,1);assert.deepEqual(d.activeSlots,['boot-tv']);assert.equal(d.runtimeErrors.length,0);assert.ok(d.overflow<=2);
    assert.ok(parseFloat(d.boot.wrapTop)<=-70,`tall-desktop CRT composition lift missing: ${d.boot.wrapTop}`);
    assert.equal(d.hero.plaque,'none');assert.equal(d.hero.status,'none');
    assert.equal(d.machine.slotRadius,'0px');assert.equal(d.machine.slotShadow,'none');assert.equal(d.machine.unitRadius,'0px');assert.equal(d.machine.unitShadow,'none');assert.equal(d.machine.screenRadius,'0px');assert.equal(d.machine.knobs,'none');
    assert.equal(d.people.src,'assets/projects/voltara-engenharia-aplicada/slide-01.webp');assert.equal(d.people.complete,true);assert.ok(d.people.naturalWidth>500);assert.equal(d.people.position,'absolute');assert.equal(d.people.opacity,'1');assert.equal(d.people.objectFit,'cover');assert.ok(d.people.image.height>=d.people.visual.height*.98,`People image no longer fills visual: ${JSON.stringify(d.people)}`);
    assert.equal(d.contact.radius,'0px');assert.equal(d.contact.landscapeRadius,'0px');assert.ok(d.contact.landscape.height>430,`contact landscape collapsed: ${JSON.stringify(d.contact)}`);assert.ok(d.contact.landscape.height>=d.contact.window.height-60);
    assert.equal(errors.length,0,`desktop page errors: ${errors.join(' | ')}`);

    for(const [name,sel] of [['boot','#boot'],['hero','#hero'],['portal','#portal'],['work','#work .scene-inner'],['machine','#machine'],['playground','#playground'],['studio','#studio'],['people','#people'],['contact','#contact']]){
      const loc=page.locator(sel);await loc.scrollIntoViewIfNeeded();await page.waitForTimeout(1050);await loc.screenshot({path:`_site/qa-v382-${name}-desktop.png`});
    }
    console.log(JSON.stringify({qa:'v382-reference-synthesis',viewport:'desktop',status:'PASS',state:d}));
    await page.close();

    const {p:mobile,errors:mobileErrors}=await makePage({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:1});
    for(const sel of ['#machine','#people','#contact']){await mobile.locator(sel).scrollIntoViewIfNeeded();await mobile.waitForTimeout(1050)}
    const m=await inspect(mobile);
    assert.equal(m.marker,'v382-world-pass');assert.equal(m.renderers,1);assert.deepEqual(m.activeSlots,['boot-tv']);assert.equal(m.runtimeErrors.length,0);assert.ok(m.overflow<=2);
    assert.equal(m.machine.unitRadius,'0px');assert.equal(m.machine.screenRadius,'0px');assert.equal(m.machine.knobs,'none');
    assert.equal(m.people.complete,true);assert.ok(m.people.image.height>=m.people.visual.height*.98);assert.ok(m.contact.landscape.height>340,`mobile contact landscape collapsed: ${JSON.stringify(m.contact)}`);
    assert.equal(mobileErrors.length,0,`mobile page errors: ${mobileErrors.join(' | ')}`);
    for(const [name,sel] of [['boot','#boot'],['hero','#hero'],['machine','#machine'],['people','#people'],['contact','#contact']]){
      const loc=mobile.locator(sel);await loc.scrollIntoViewIfNeeded();await mobile.waitForTimeout(1050);await loc.screenshot({path:`_site/qa-v382-${name}-mobile.png`});
    }
    console.log(JSON.stringify({qa:'v382-reference-synthesis',viewport:'mobile',status:'PASS',state:m}));
    await mobile.close();
  } finally {await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
