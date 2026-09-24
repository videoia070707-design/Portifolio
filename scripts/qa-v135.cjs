const {chromium}=require('playwright');
const assert=require('node:assert/strict');

(async()=>{
  const browser=await chromium.launch({headless:true});
  try{
    const page=await browser.newPage({viewport:{width:1440,height:1000},deviceScaleFactor:1});
    await page.addInitScript(()=>localStorage.setItem('movx-theme','dark'));
    await page.goto('http://127.0.0.1:4173/social-media.html',{waitUntil:'networkidle'});
    await page.waitForFunction(()=>document.documentElement.dataset.movxV135==='approved-redesign');

    /* Protected surfaces stay untouched by v135. */
    assert.equal(await page.locator('.social-cover-art .v135-archive-preview,.social-cover-art .v135-service-visual,.social-cover-art .v135-about-pillars').count(),0,'v135 must not inject into the cover hero');
    assert.equal(await page.locator('[data-movx-scroll-world="v117"] .v135-archive-preview,[data-movx-scroll-world="v117"] .v135-service-visual,[data-movx-scroll-world="v117"] .v135-about-pillars').count(),0,'v135 must not inject into Scroll World');
    assert.equal(await page.locator('#projectsList .v135-service-visual,#projectsList .v135-about-pillars').count(),0,'v135 must not rewrite selected cases');

    /* Archive direction. */
    const archive=page.locator('#archiveControls');
    await archive.scrollIntoViewIfNeeded();
    await page.waitForTimeout(200);
    assert.equal(await archive.locator('.v135-archive-preview').count(),1,'Archive must have one authored preview strip');
    assert.ok(await archive.locator('.v135-archive-preview__item').count()>=1,'Archive preview must contain project media');
    assert.ok(await archive.locator('.archive-grid .archive-card').count()>=4,'Archive project grid must remain populated');
    const archiveTitle=(await archive.locator('.archive-head h2').innerText()).toLowerCase();
    assert.ok(archiveTitle.includes('arquivo')&&archiveTitle.includes('projetos'),'Archive copy must use approved living-archive direction');

    /* Services direction. */
    const services=page.locator('#services');
    await services.scrollIntoViewIfNeeded();
    await page.waitForTimeout(200);
    assert.equal(await services.locator('.v135-service-visual').count(),1,'Services must have one chrome-object visual');
    assert.ok(await services.locator('.v135-service-object .v135-loop').count()>=3,'Chrome object must include multiple authored loops');
    assert.equal(await services.locator('.services-list .service-row').count(),4,'Services must retain four core service areas');
    const servicesTitle=(await services.locator('.section-intro h2').innerText()).toLowerCase();
    assert.ok(servicesTitle.includes('estrutura')&&servicesTitle.includes('sólido'),'Services copy must match approved direction');

    /* Simplified human manifesto. */
    const about=page.locator('#about');
    await about.scrollIntoViewIfNeeded();
    await page.waitForTimeout(160);
    assert.equal(await about.locator('.v135-about-pillars').count(),1,'About must have one compact pillars row');
    assert.equal(await about.locator('.v135-about-pillar').count(),3,'About must stay intentionally concise with three pillars');
    const aboutTitle=(await about.locator('.about-heading h2').innerText()).toLowerCase();
    assert.ok(aboutTitle.includes('movimento')&&aboutTitle.includes('pessoas'),'About headline must preserve the approved manifesto');
    assert.equal(await about.locator('.about-copy>p:not(.about-lead)').evaluateAll(nodes=>nodes.every(n=>getComputedStyle(n).display==='none')),true,'Secondary About paragraph must be hidden to avoid information overload');

    /* Responsive integrity. */
    await page.setViewportSize({width:390,height:844});
    await page.reload({waitUntil:'networkidle'});
    await page.waitForFunction(()=>document.documentElement.dataset.movxV135==='approved-redesign');
    const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
    assert.ok(overflow<=2,`Mobile v135 must not cause horizontal overflow (${overflow}px)`);
    assert.equal(await page.locator('#archiveControls .archive-grid').evaluate(el=>getComputedStyle(el).gridTemplateColumns.split(' ').length),1,'Archive must become one column on narrow mobile');
    assert.equal(await page.locator('#services .services-list').evaluate(el=>getComputedStyle(el).gridTemplateColumns.split(' ').length),1,'Services must become one column on narrow mobile');

    console.log(JSON.stringify({qa:'v135',status:'PASS',protected:['hero','scroll-world','selected-cases'],scope:['archive','services','about']}));
  } finally {
    await browser.close();
  }
})().catch(error=>{console.error(error);process.exit(1)});
