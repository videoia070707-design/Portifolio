const {chromium}=require('playwright');
const fs=require('node:fs/promises');
(async()=>{
  const browser=await chromium.launch({headless:true});
  const report=[];
  const page=await browser.newPage({viewport:{width:1440,height:900},reducedMotion:'no-preference'});
  const errors=[];page.on('pageerror',e=>errors.push(String(e)));
  await page.goto('http://127.0.0.1:4173/social-media.html',{waitUntil:'networkidle'});
  await page.waitForFunction(()=>document.documentElement.dataset.movxV108==='institutional-depth');
  await page.waitForFunction(()=>['ready','fallback'].includes(document.documentElement.dataset.v108Webgl),null,{timeout:8000});

  const initial=await page.evaluate(()=>{
    const root=document.documentElement;
    const journey=document.querySelector('#process .v55-process-journey');
    const grid=journey?.querySelector('.process-grid');
    return {
      version:root.dataset.movxV108,
      webgl:root.dataset.v108Webgl,
      about:!!document.querySelector('#about .v108-about-depth'),
      serviceDepth:document.querySelectorAll('#services .v108-services-depth__index').length,
      processCanvas:!!document.querySelector('#process .v108-process-canvas'),
      contact:!!document.querySelector('#contact .v108-contact-depth__x'),
      journeyHeight:journey?.getBoundingClientRect().height||0,
      gridPosition:grid?getComputedStyle(grid).position:null,
      overflow:root.scrollWidth-innerWidth
    };
  });
  if(initial.version!=='institutional-depth'||initial.webgl!=='ready'||!initial.about||initial.serviceDepth<4||!initial.processCanvas||!initial.contact||initial.journeyHeight<3000||initial.gridPosition!=='sticky'||initial.overflow>2)throw Error(JSON.stringify({initial}));
  report.push({initial});

  async function goTo(selector,fraction=.5,name){
    const target=await page.evaluate(({selector,fraction})=>{
      const el=document.querySelector(selector);if(!el)return null;
      const top=el.getBoundingClientRect().top+scrollY;
      const travel=Math.max(0,el.offsetHeight-innerHeight);
      return Math.round(top+travel*fraction);
    },{selector,fraction});
    if(target===null)throw Error('Missing selector '+selector);
    await page.evaluate(y=>scrollTo({top:y,behavior:'instant'}),target);
    await page.waitForTimeout(420);
    const state=await page.evaluate(()=>({
      overflow:document.documentElement.scrollWidth-innerWidth,
      step:document.documentElement.dataset.movxProcessStep||null,
      processProgress:parseFloat(getComputedStyle(document.querySelector('#process .v55-process-journey')).getPropertyValue('--v108-process-progress'))||0,
      activeRows:document.querySelectorAll('#process .process-list li.v108-process-active').length,
      activeServices:document.querySelectorAll('#services .service-row.v108-service-active').length
    }));
    if(state.overflow>2)throw Error(JSON.stringify({name,state}));
    await page.screenshot({path:`_site/qa-v108-${name}.png`,fullPage:false});
    report.push({name,state});
    return state;
  }

  await goTo('#about',.42,'about-depth');
  await goTo('#services',.56,'services-depth');
  const p1=await goTo('#process .v55-process-journey',.08,'process-01');
  const p3=await goTo('#process .v55-process-journey',.50,'process-03');
  const p5=await goTo('#process .v55-process-journey',.90,'process-05');
  if(!(p1.processProgress<p3.processProgress&&p3.processProgress<p5.processProgress&&Number(p1.step)<=2&&Number(p3.step)>=2&&Number(p3.step)<=4&&Number(p5.step)>=4&&p3.activeRows===1))throw Error(JSON.stringify({p1,p3,p5}));
  await goTo('#contact',.45,'contact-depth');

  const mobile=await browser.newPage({viewport:{width:390,height:844},reducedMotion:'no-preference'});
  await mobile.goto('http://127.0.0.1:4173/social-media.html',{waitUntil:'networkidle'});
  await mobile.waitForFunction(()=>document.documentElement.dataset.movxV108==='institutional-depth');
  await mobile.waitForTimeout(350);
  const m=await mobile.evaluate(()=>({
    webgl:document.documentElement.dataset.v108Webgl,
    canvas:getComputedStyle(document.querySelector('.v108-process-canvas')).display,
    rowPosition:getComputedStyle(document.querySelector('#process .process-list li')).position,
    overflow:document.documentElement.scrollWidth-innerWidth
  }));
  if(m.webgl!=='mobile-fallback'||m.canvas!=='none'||m.rowPosition==='absolute'||m.overflow>2)throw Error(JSON.stringify({mobile:m}));
  report.push({mobile:m});

  const reducedPage=await browser.newPage({viewport:{width:1280,height:900},reducedMotion:'reduce'});
  await reducedPage.goto('http://127.0.0.1:4173/social-media.html',{waitUntil:'networkidle'});
  await reducedPage.waitForFunction(()=>document.documentElement.dataset.movxV108==='institutional-depth');
  await reducedPage.waitForTimeout(300);
  const r=await reducedPage.evaluate(()=>({
    webgl:document.documentElement.dataset.v108Webgl,
    canvas:getComputedStyle(document.querySelector('.v108-process-canvas')).display,
    rowPosition:getComputedStyle(document.querySelector('#process .process-list li')).position,
    overflow:document.documentElement.scrollWidth-innerWidth
  }));
  if(r.webgl!=='reduced'||r.canvas!=='none'||r.rowPosition==='absolute'||r.overflow>2)throw Error(JSON.stringify({reduced:r}));
  report.push({reduced:r});

  if(errors.length)throw Error(errors.join('\n'));
  await fs.writeFile('_site/qa-v108-report.json',JSON.stringify(report,null,2));
  await browser.close();
  console.log('MOVX v108: About/Services/Process/Contact depth, real process corridor, responsive fallback and reduced-motion safety validated.');
})().catch(e=>{console.error(e);process.exit(1)});
