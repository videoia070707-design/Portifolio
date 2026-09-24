const {chromium}=require('playwright');
const assert=require('node:assert/strict');

(async()=>{
  const browser=await chromium.launch({headless:true});
  try{
    const page=await browser.newPage({viewport:{width:1440,height:900},deviceScaleFactor:1});
    await page.addInitScript(()=>localStorage.setItem('movx-theme','dark'));
    await page.goto('http://127.0.0.1:4173/social-media.html',{waitUntil:'networkidle'});
    await page.waitForFunction(()=>document.documentElement.dataset.movxV134==='surgical-tech-refine');

    /* Protected areas: v134 must not inject design objects into the already-approved hero/video/cases. */
    assert.equal(await page.locator('.social-cover-art .v134-signal-field,.social-cover-art .v134-services-signal').count(),0,'v134 must leave the hero untouched');
    assert.equal(await page.locator('[data-movx-scroll-world="v117"] .v134-signal-field,[data-movx-scroll-world="v117"] .v134-services-signal').count(),0,'v134 must leave Scroll World untouched');
    assert.equal(await page.locator('#projectsList .v134-signal-field,#projectsList .v134-services-signal').count(),0,'v134 must leave selected cases untouched');

    const about=page.locator('#about');
    await about.scrollIntoViewIfNeeded();await page.waitForTimeout(250);
    assert.equal(await about.locator('.v134-signal-field').count(),1,'About must receive one authored signal field');
    assert.ok(await about.locator('.v134-signal-field path').count()>=5,'About signal field must contain multiple fluid paths');
    const oldAbout=await about.locator('.v108-about-depth__word,.v108-about-depth__slab,.v108-about-depth__ring').evaluateAll(nodes=>nodes.map(n=>getComputedStyle(n).display));
    oldAbout.forEach(display=>assert.equal(display,'none','old word/slab/ring ornaments must be retired'));
    await page.screenshot({path:'_site/qa-v134-about-signal.png',fullPage:false});

    const services=page.locator('#services');
    await services.scrollIntoViewIfNeeded();await page.waitForTimeout(300);
    assert.equal(await services.locator('.v134-services-signal').count(),1,'Services must receive one compact signal map');
    const oldIndices=await services.locator('.v108-services-depth__index').evaluateAll(nodes=>nodes.map(n=>getComputedStyle(n).display));
    oldIndices.forEach(display=>assert.equal(display,'none','giant outlined service numerals must be hidden'));
    assert.match(await services.locator('[data-i18n="home.service4"]').innerText(),/Produção audiovisual/i,'fourth service must be Produção audiovisual');
    assert.equal(await services.locator('.v134-services-signal path.is-active').count(),1,'signal map must expose one active service path');
    await page.screenshot({path:'_site/qa-v134-services-signal.png',fullPage:false});

    const contact=page.locator('#contact');
    await contact.scrollIntoViewIfNeeded();await page.waitForTimeout(180);
    const options=await contact.locator('select[name="project"] option').allTextContents();
    assert.ok(options.includes('Produção audiovisual'),`contact must include Produção audiovisual: ${JSON.stringify(options)}`);
    assert.ok(options.includes('Website / UI/UX'),`contact must include Website / UI/UX: ${JSON.stringify(options)}`);
    assert.ok(options.includes('AI Creator'),`contact must keep AI Creator: ${JSON.stringify(options)}`);

    const footer=page.locator('.v65-footer-disciplines');
    await footer.scrollIntoViewIfNeeded();await page.waitForTimeout(100);
    assert.equal(await footer.locator('a').count(),4,'footer discipline nav must contain four areas');
    const footerState=await footer.evaluate(el=>{
      const links=[...el.querySelectorAll('a')];
      const boxes=links.map(a=>a.getBoundingClientRect());
      const s=getComputedStyle(el);
      return {display:s.display,columns:s.gridTemplateColumns,tops:boxes.map(b=>Math.round(b.top)),widths:boxes.map(b=>Math.round(b.width)),scrollWidth:el.scrollWidth,clientWidth:el.clientWidth};
    });
    assert.equal(footerState.display,'grid','desktop discipline footer must be a grid');
    assert.equal(new Set(footerState.tops).size,1,`all four discipline links must share one row: ${JSON.stringify(footerState)}`);
    assert.ok(Math.max(...footerState.widths)-Math.min(...footerState.widths)<=2,`four footer columns must be equal width: ${JSON.stringify(footerState)}`);
    assert.ok(footerState.scrollWidth<=footerState.clientWidth+1,'desktop footer must not overflow horizontally');
    await page.screenshot({path:'_site/qa-v134-footer-four-up.png',fullPage:false});
    await page.close();

    const mobile=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true});
    await mobile.addInitScript(()=>localStorage.setItem('movx-theme','dark'));
    await mobile.goto('http://127.0.0.1:4173/social-media.html',{waitUntil:'networkidle'});
    await mobile.waitForFunction(()=>document.documentElement.dataset.movxV134==='surgical-tech-refine');
    const mobileFooter=mobile.locator('.v65-footer-disciplines');
    await mobileFooter.scrollIntoViewIfNeeded();
    const mobileOverflow=await mobileFooter.evaluate(el=>({scrollWidth:el.scrollWidth,clientWidth:el.clientWidth,cols:getComputedStyle(el).gridTemplateColumns}));
    assert.ok(mobileOverflow.scrollWidth<=mobileOverflow.clientWidth+1,`mobile footer must not overflow: ${JSON.stringify(mobileOverflow)}`);
    const mobileOptions=await mobile.locator('#contact select[name="project"] option').allTextContents();
    assert.ok(mobileOptions.includes('Website / UI/UX')&&mobileOptions.includes('Produção audiovisual'),'mobile CTA must keep new project choices');
    await mobile.close();

    console.log(JSON.stringify({status:'passed',scope:'surgical',about:'signal-field',services:'signal-map',contact:['Produção audiovisual','Website / UI/UX','AI Creator'],footer:'4-up desktop',protected:['hero','scroll-world','cases']}));
  }finally{await browser.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
