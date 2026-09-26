const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const {writeFile}=require('node:fs/promises');

(async()=>{
  const browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-webgl','--ignore-gpu-blocklist']});
  const report={release:'v321-production-storyboard',desktop:{},mobile:{}};
  try{
    const page=await browser.newPage({viewport:{width:1440,height:1000},deviceScaleFactor:1,reducedMotion:'no-preference'});
    const errors=[]; page.on('pageerror',e=>errors.push(String(e)));
    await page.goto('http://127.0.0.1:4173/',{waitUntil:'domcontentloaded',timeout:30000});
    await page.waitForFunction(()=>document.documentElement.dataset.movxProduction==='v321-production-storyboard',null,{timeout:10000});
    await page.waitForFunction(()=>document.documentElement.classList.contains('v320'),null,{timeout:10000});
    await page.waitForFunction(()=>window.MOVX3D&&window.MOVX3D.slots&&window.MOVX3D.slots['closing-window'],null,{timeout:10000});

    const desktop=await page.evaluate(()=>{
      const sceneIds=[...document.querySelectorAll('main>.scene')].map(el=>el.id);
      const slots=[...document.querySelectorAll('[data-model-slot]')].map(el=>el.dataset.modelSlot);
      const runtimeSlots=Object.keys(window.MOVX3D?.slots||{});
      const nav=[...document.querySelectorAll('a[href^="#"]')].map(a=>a.getAttribute('href'));
      const cards=[...document.querySelectorAll('.case-card img')].slice(0,2).map(img=>({complete:img.complete,width:img.naturalWidth,src:img.getAttribute('src')}));
      return {
        title:document.title,
        production:document.documentElement.dataset.movxProduction,
        storyboard:document.documentElement.dataset.storyboard,
        sceneIds,slots,runtimeSlots,nav,cards,
        overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth,
        href:location.pathname,
      };
    });
    const expectedScenes=['boot','hero','portal','work','machine','playground','studio','people','contact'];
    const expectedSlots=['boot-tv','hero-movx-logo','x-portal','creative-machine','play-cassette','play-camera','play-cube','play-cd','play-window','spatial-studio','closing-window'];
    assert.deepEqual(desktop.sceneIds,expectedScenes,'production scene order changed');
    expectedSlots.forEach(slot=>assert.ok(desktop.slots.includes(slot),`DOM model slot missing: ${slot}`));
    for(const slot of ['boot-tv','hero-movx-logo','x-portal','creative-machine','play-cassette','play-camera','play-cube','play-cd','play-window','spatial-studio','closing-window']){
      assert.ok(desktop.runtimeSlots.includes(slot),`runtime model slot missing: ${slot}`);
    }
    assert.ok(desktop.nav.includes('#work')&&desktop.nav.includes('#contact'),'internal root navigation missing');
    assert.ok(desktop.overflow<=2,`desktop horizontal overflow: ${desktop.overflow}px`);
    assert.equal(errors.length,0,'desktop JS errors: '+errors.join(' | '));
    await page.locator('#work').scrollIntoViewIfNeeded();
    await page.waitForTimeout(650);
    const loadedCards=await page.evaluate(()=>[...document.querySelectorAll('.case-card img')].slice(0,2).every(img=>img.complete&&img.naturalWidth>0));
    assert.ok(loadedCards,'first project covers did not load from production asset paths');
    await page.screenshot({path:'_site/qa-v321-home-desktop.png',fullPage:false});
    report.desktop={...desktop,loadedCards,pageErrors:errors};

    const mobile=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1,reducedMotion:'no-preference'});
    const mobileErrors=[]; mobile.on('pageerror',e=>mobileErrors.push(String(e)));
    await mobile.goto('http://127.0.0.1:4173/',{waitUntil:'domcontentloaded',timeout:30000});
    await mobile.waitForFunction(()=>document.documentElement.dataset.movxProduction==='v321-production-storyboard',null,{timeout:10000});
    await mobile.waitForFunction(()=>window.MOVX3D?.slots?.['closing-window'],null,{timeout:10000});
    const mobileState=await mobile.evaluate(()=>({
      overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth,
      sceneCount:document.querySelectorAll('main>.scene').length,
      slotCount:document.querySelectorAll('[data-model-slot]').length,
      reduced:matchMedia('(prefers-reduced-motion: reduce)').matches,
      contact:!!document.querySelector('#contact .contact-window'),
      playground:!!document.querySelector('#playground .float-zone'),
    }));
    assert.equal(mobileState.sceneCount,9,'mobile scene count changed');
    assert.ok(mobileState.slotCount>=11,'mobile model slots missing');
    assert.ok(mobileState.contact&&mobileState.playground,'mobile storyboard sections missing');
    assert.ok(mobileState.overflow<=2,`mobile horizontal overflow: ${mobileState.overflow}px`);
    assert.equal(mobileErrors.length,0,'mobile JS errors: '+mobileErrors.join(' | '));
    await mobile.screenshot({path:'_site/qa-v321-home-mobile.png',fullPage:false});
    report.mobile={...mobileState,pageErrors:mobileErrors};
    await mobile.close();

    await writeFile('_site/qa-v321-report.json',JSON.stringify(report,null,2));
    console.log(JSON.stringify({qa:'v321-production-storyboard',status:'PASS',scenes:expectedScenes,slots:expectedSlots}));
  } finally {await browser.close();}
})().catch(err=>{console.error(err);process.exit(1)});
