const {chromium}=require('playwright');
const fs=require('node:fs/promises');
(async()=>{
  const browser=await chromium.launch({headless:true});
  const report=[];
  async function open(viewport,reducedMotion='no-preference'){
    const page=await browser.newPage({viewport,reducedMotion});
    const errors=[]; page.on('pageerror',e=>errors.push(String(e)));
    await page.goto('http://127.0.0.1:4173/social-media.html',{waitUntil:'networkidle'});
    await page.waitForFunction(()=>document.querySelector('[data-movx-v116="film"]'));
    if(errors.length)throw Error(JSON.stringify({errors}));
    return page;
  }
  const desktop=await open({width:1440,height:900});
  const base=await desktop.evaluate(()=>{
    const hero=document.querySelector('.social-cover-art');
    const film=document.querySelector('[data-movx-v116="film"]');
    const archive=document.querySelector('#livingArchive');
    const video=film?.querySelector('video');
    return {ordered:!!(hero&&film&&archive&&(hero.compareDocumentPosition(film)&Node.DOCUMENT_POSITION_FOLLOWING)&&(film.compareDocumentPosition(archive)&Node.DOCUMENT_POSITION_FOLLOWING)),mode:film?.dataset.v116Mode,duration:video?.duration||0,videoWidth:video?.videoWidth||0,src:video?.currentSrc||'',overflow:document.documentElement.scrollWidth-innerWidth,filmHeight:film?.offsetHeight||0,viewport:innerHeight};
  });
  if(!base.ordered||base.mode!=='scrub'||base.duration<4||base.videoWidth<900||base.overflow>2||base.filmHeight<base.viewport*3)throw Error(JSON.stringify({desktopBase:base}));
  report.push({desktopBase:base});
  const samples=[];
  for(const p of [.08,.32,.52,.74,.99]){
    await desktop.evaluate(p=>{const film=document.querySelector('[data-movx-v116="film"]');const travel=film.offsetHeight-innerHeight;scrollTo(0,film.offsetTop+travel*p)},p);
    await desktop.waitForTimeout(180);
    const state=await desktop.evaluate(()=>{const film=document.querySelector('[data-movx-v116="film"]');const v=film.querySelector('video');return {p:Number(film.dataset.v116Progress||0),phase:film.dataset.v116Phase,time:v.currentTime,opacity:getComputedStyle(film.querySelector('.into-signal-film__plane')).opacity}});
    samples.push(state);
  }
  for(let i=1;i<samples.length;i++)if(!(samples[i].time>samples[i-1].time))throw Error(JSON.stringify({nonMonotonic:samples}));
  if(samples[0].phase!=='signal'||samples[2].phase!=='crossing'||samples[3].phase!=='archive')throw Error(JSON.stringify({badPhases:samples}));
  if(Number(samples.at(-1).opacity)>.35)throw Error(JSON.stringify({handoffOpacity:samples.at(-1)}));
  report.push({desktopSamples:samples});
  await desktop.screenshot({path:'_site/qa-v116-into-signal-end.png',fullPage:false});
  const mobile=await open({width:390,height:844});
  const mobileState=await mobile.evaluate(()=>{const film=document.querySelector('[data-movx-v116="film"]');return {mode:film.dataset.v116Mode,height:film.offsetHeight,viewport:innerHeight,sticky:getComputedStyle(film.querySelector('.into-signal-film__sticky')).position,overflow:document.documentElement.scrollWidth-innerWidth}});
  if(mobileState.mode!=='static'||mobileState.sticky==='sticky'||mobileState.height>mobileState.viewport*1.2||mobileState.overflow>2)throw Error(JSON.stringify({mobileState}));
  report.push({mobileState});
  await mobile.screenshot({path:'_site/qa-v116-into-signal-mobile.png',fullPage:false});
  const reduced=await open({width:1280,height:800},'reduce');
  const reducedState=await reduced.evaluate(()=>{const film=document.querySelector('[data-movx-v116="film"]');return {mode:film.dataset.v116Mode,sticky:getComputedStyle(film.querySelector('.into-signal-film__sticky')).position,height:film.offsetHeight,viewport:innerHeight}});
  if(reducedState.mode!=='static'||reducedState.sticky==='sticky'||reducedState.height>reducedState.viewport*1.25)throw Error(JSON.stringify({reducedState}));
  report.push({reducedState});
  await fs.writeFile('_site/qa-v116-scroll-film-report.json',JSON.stringify(report,null,2));
  await browser.close();
  console.log('MOVX v116: scroll-driven film, chapter timing, handoff fade, mobile and reduced-motion fallbacks validated.');
})().catch(e=>{console.error(e);process.exit(1)});
