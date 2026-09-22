const {chromium}=require('playwright');
const fs=require('node:fs/promises');
(async()=>{
  const browser=await chromium.launch({headless:true});
  const report=[];

  const page=await browser.newPage({viewport:{width:1280,height:900},reducedMotion:'no-preference'});
  const errors=[];page.on('pageerror',e=>errors.push(String(e)));
  await page.goto('http://127.0.0.1:4173/social-media.html',{waitUntil:'networkidle'});
  await page.waitForTimeout(650);
  const initial=await page.evaluate(()=>({
    version:document.documentElement.dataset.movxV106,
    webgl:document.documentElement.dataset.v106Webgl,
    stage:!!document.querySelector('.v106-webgl-stage'),
    sculptureCount:document.querySelectorAll('.v106-chapter-sculpture').length,
    overflow:document.documentElement.scrollWidth-innerWidth,
    progress:parseFloat(getComputedStyle(document.querySelector('.social-cover-art__stage')).getPropertyValue('--v106-progress'))||0
  }));
  if(initial.version!=='dimensional-motion'||initial.sculptureCount<3||initial.overflow>2)throw Error(JSON.stringify({initial}));
  if(!['ready','fallback'].includes(initial.webgl))throw Error(JSON.stringify({unexpectedWebglState:initial.webgl}));

  await page.evaluate(()=>scrollTo({top:Math.min(innerHeight*.72,document.documentElement.scrollHeight-innerHeight),behavior:'instant'}));
  await page.waitForTimeout(350);
  const moved=await page.evaluate(()=>({
    progress:parseFloat(getComputedStyle(document.querySelector('.social-cover-art__stage')).getPropertyValue('--v106-progress'))||0,
    overflow:document.documentElement.scrollWidth-innerWidth,
    stageOpacity:document.querySelector('.v106-webgl-stage')?parseFloat(getComputedStyle(document.querySelector('.v106-webgl-stage')).opacity):null
  }));
  if(moved.progress<=initial.progress+.08||moved.overflow>2)throw Error(JSON.stringify({initial,moved}));
  await page.screenshot({path:'_site/qa-v106-social-1280.png',fullPage:false});
  report.push({initial,moved});

  for(const path of ['video-editor.html','ai-creator.html','ui-ux.html']){
    await page.goto('http://127.0.0.1:4173/'+path,{waitUntil:'networkidle'});
    await page.waitForTimeout(180);
    const data=await page.evaluate(()=>({
      page:document.body.dataset.page,
      sculpture:!!document.querySelector('.page-hero > .v106-page-sculpture'),
      overflow:document.documentElement.scrollWidth-innerWidth,
      hero:document.querySelector('.page-hero')?.getBoundingClientRect().height||0
    }));
    if(!data.sculpture||data.overflow>2||data.hero<200)throw Error(JSON.stringify({path,data}));
    report.push({path,data});
  }

  const reducedPage=await browser.newPage({viewport:{width:1280,height:900},reducedMotion:'reduce'});
  await reducedPage.goto('http://127.0.0.1:4173/social-media.html',{waitUntil:'networkidle'});
  await reducedPage.waitForTimeout(220);
  const reduced=await reducedPage.evaluate(()=>({
    reduced:document.documentElement.classList.contains('v106-reduced'),
    webgl:document.documentElement.dataset.v106Webgl,
    stage:!!document.querySelector('.v106-webgl-stage'),
    overflow:document.documentElement.scrollWidth-innerWidth
  }));
  if(!reduced.reduced||reduced.stage||reduced.overflow>2)throw Error(JSON.stringify({reduced}));
  report.push({reduced});

  if(errors.length)throw Error(errors.join('\n'));
  await fs.writeFile('_site/qa-v106-report.json',JSON.stringify(report,null,2));
  await browser.close();
  console.log('MOVX v106: dimensional motion, WebGL/CSS fallback, scroll response and reduced-motion safety validated.');
})().catch(e=>{console.error(e);process.exit(1)});
