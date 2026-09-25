const {chromium}=require('playwright');
const fs=require('node:fs/promises');
(async()=>{
  const browser=await chromium.launch({headless:true});
  const report=[];

  const page=await browser.newPage({viewport:{width:1280,height:900},reducedMotion:'no-preference'});
  const errors=[];page.on('pageerror',e=>errors.push(String(e)));
  await page.goto('http://127.0.0.1:4173/social-media.html',{waitUntil:'networkidle'});
  await page.waitForFunction(()=>{
    const root=document.documentElement;
    return root.dataset.movxV136==='fluid-morph'
      ? ['ready','fallback'].includes(root.dataset.v136Webgl)
      : ['ready','fallback'].includes(root.dataset.v106Webgl);
  },null,{timeout:8000});

  const isV136=await page.evaluate(()=>document.documentElement.dataset.movxV136==='fluid-morph');
  if(isV136){
    const initial=await page.evaluate(()=>({
      version:document.documentElement.dataset.movxV136,
      webgl:document.documentElement.dataset.v136Webgl,
      hero:!!document.querySelector('.v136-fluid-hero'),
      canvas:!!document.querySelector('.v136-fluid-hero__canvas'),
      stateCount:document.querySelectorAll('.v136-fluid-state').length,
      state:document.documentElement.dataset.v136State,
      overflow:document.documentElement.scrollWidth-innerWidth
    }));
    if(initial.version!=='fluid-morph'||!initial.hero||!initial.canvas||initial.stateCount!==4||initial.overflow>2)throw Error(JSON.stringify({initial}));
    if(!['ready','fallback'].includes(initial.webgl))throw Error(JSON.stringify({unexpectedWebglState:initial.webgl}));

    await page.evaluate(()=>{
      const el=document.querySelector('.v136-fluid-hero');
      const travel=Math.max(1,el.offsetHeight-innerHeight);
      scrollTo({top:el.offsetTop+travel*.34,behavior:'instant'});
    });
    await page.waitForTimeout(520);
    const moved=await page.evaluate(()=>({
      state:document.documentElement.dataset.v136State,
      overflow:document.documentElement.scrollWidth-innerWidth,
      progressText:document.querySelector('.v136-fluid-hero__state-readout em')?.textContent||'',
      active:document.querySelector('.v136-fluid-state.is-active strong')?.textContent||''
    }));
    if(!['RING','TOWER'].includes(moved.state)||moved.overflow>2)throw Error(JSON.stringify({initial,moved}));
    await page.screenshot({path:'_site/qa-v106-social-1280.png',fullPage:false});
    report.push({architecture:'v136-fluid-morph',initial,moved});
  }else{
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
    report.push({architecture:'legacy-v106',initial,moved});
  }

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
  await reducedPage.waitForTimeout(350);
  const reducedV136=await reducedPage.evaluate(()=>document.documentElement.dataset.movxV136==='fluid-morph');
  if(reducedV136){
    const reduced=await reducedPage.evaluate(()=>({
      hero:!!document.querySelector('.v136-fluid-hero'),
      state:document.documentElement.dataset.v136State,
      overflow:document.documentElement.scrollWidth-innerWidth,
      height:document.querySelector('.v136-fluid-hero')?.getBoundingClientRect().height||0
    }));
    if(!reduced.hero||reduced.overflow>2||reduced.height<600)throw Error(JSON.stringify({reduced}));
    report.push({architecture:'v136-fluid-morph',reduced});
  }else{
    const reduced=await reducedPage.evaluate(()=>({
      reduced:document.documentElement.classList.contains('v106-reduced'),
      webgl:document.documentElement.dataset.v106Webgl,
      stage:!!document.querySelector('.v106-webgl-stage'),
      overflow:document.documentElement.scrollWidth-innerWidth
    }));
    if(!reduced.reduced||reduced.stage||reduced.overflow>2)throw Error(JSON.stringify({reduced}));
    report.push({architecture:'legacy-v106',reduced});
  }

  if(errors.length)throw Error(errors.join('\n'));
  await fs.writeFile('_site/qa-v106-report.json',JSON.stringify(report,null,2));
  await browser.close();
  console.log('MOVX v106 compatibility QA: v136 fluid morph or legacy dimensional motion validated, plus internal page sculptures and reduced-motion safety.');
})().catch(e=>{console.error(e);process.exit(1)});
