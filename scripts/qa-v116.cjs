const {chromium}=require('playwright');
const fs=require('node:fs/promises');

(async()=>{
  // v116 is specifically validating H.264 scroll-scrubbing. Use installed
  // Google Chrome rather than Playwright's open-source Chromium so the gate
  // matches the codecs available to real Chrome users on desktop/mobile.
  const browser=await chromium.launch({channel:'chrome',headless:true});
  const report=[];
  const url='http://127.0.0.1:4173/social-media.html';
  const cloudinaryHost='res.cloudinary.com';
  const cloudinaryFile='/0923.mp4';

  async function waitForFilm(page){
    await page.waitForSelector('[data-movx-v116="film"]');
    await page.locator('[data-movx-v116="film"]').scrollIntoViewIfNeeded();
    await page.waitForFunction(()=>{
      const s=document.querySelector('[data-movx-v116="film"]');
      const v=s?.querySelector('video');
      return s?.dataset.v116Mode==='scrub'&&v&&Number.isFinite(v.duration)&&v.duration>4;
    },null,{timeout:30000});
  }

  const isCloudinary=src=>src.includes(cloudinaryHost)&&src.endsWith(cloudinaryFile);

  async function filmMetrics(page){
    return page.evaluate(()=>{
      const s=document.querySelector('[data-movx-v116="film"]');
      return {top:s.offsetTop,travel:Math.max(1,s.offsetHeight-innerHeight)};
    });
  }

  async function sample(page,metrics,label,p,prefix){
    await page.evaluate(y=>scrollTo(0,y),metrics.top+metrics.travel*p);
    await page.waitForTimeout(520);
    const state=await page.evaluate(()=>{
      const s=document.querySelector('[data-movx-v116="film"]');
      const v=s.querySelector('video');
      const css=getComputedStyle(s);
      return {
        mode:s.dataset.v116Mode,
        viewport:s.dataset.v116Viewport,
        progress:Number(s.dataset.v116Progress||0),
        phase:s.dataset.v116Phase,
        time:v.currentTime,
        duration:v.duration,
        readyState:v.readyState,
        networkState:v.networkState,
        scale:Number(css.getPropertyValue('--v116-scale').trim()||1),
        opacity:Number(css.getPropertyValue('--v116-opacity').trim()||1),
        handoff:Number(css.getPropertyValue('--v116-handoff').trim()||0)
      };
    });
    report.push({prefix,label,state});
    await page.screenshot({path:`_site/qa-v116-${prefix}-${label}.png`,fullPage:false});
    return state;
  }

  const desktop=await browser.newPage({viewport:{width:1440,height:900},reducedMotion:'no-preference'});
  const desktopErrors=[]; const desktopRequests=[];
  desktop.on('pageerror',e=>desktopErrors.push(String(e)));
  desktop.on('requestfailed',r=>{if(r.url().includes('cloudinary.com'))desktopRequests.push({url:r.url(),failure:r.failure()})});
  await desktop.goto(url,{waitUntil:'networkidle'});
  await waitForFilm(desktop);
  const desktopInitial=await desktop.evaluate(()=>{
    const s=document.querySelector('[data-movx-v116="film"]');
    const v=s.querySelector('video');
    return {mode:s.dataset.v116Mode,viewport:s.dataset.v116Viewport,duration:v.duration,readyState:v.readyState,networkState:v.networkState,canPlayH264:v.canPlayType('video/mp4; codecs="avc1.42E01E"'),src:v.currentSrc,hero:!!document.querySelector('.social-cover-art'),archive:!!document.querySelector('#livingArchive'),overflow:document.documentElement.scrollWidth-innerWidth,autoplay:v.autoplay,controls:v.controls,sticky:getComputedStyle(s.querySelector('.into-signal-film__sticky')).position};
  });
  if(desktopErrors.length||desktopRequests.length)throw Error(JSON.stringify({desktopErrors,desktopRequests,desktopInitial}));
  if(desktopInitial.mode!=='scrub'||desktopInitial.viewport!=='desktop'||desktopInitial.duration<4||desktopInitial.duration>6||!isCloudinary(desktopInitial.src))throw Error(JSON.stringify({desktopInitial}));
  if(!desktopInitial.hero||!desktopInitial.archive||desktopInitial.overflow>2||desktopInitial.autoplay||desktopInitial.controls||desktopInitial.sticky!=='sticky')throw Error(JSON.stringify({desktopInitial}));
  report.push({desktopInitial});
  const dm=await filmMetrics(desktop);
  const desktopStates=[];
  for(const [label,p] of [['signal',.18],['crossing',.50],['archive',.78],['handoff',.97]])desktopStates.push(await sample(desktop,dm,label,p,'desktop'));
  if(!(desktopStates[0].time<desktopStates[1].time&&desktopStates[1].time<desktopStates[2].time&&desktopStates[2].time<desktopStates[3].time))throw Error(JSON.stringify({desktopStates}));
  if(desktopStates[0].time>1.6)throw Error(JSON.stringify({desktopOpeningNotHeld:desktopStates[0]}));
  if(desktopStates[3].handoff<.65||desktopStates[3].opacity>.35)throw Error(JSON.stringify({desktopHandoff:desktopStates[3]}));

  const mobile=await browser.newPage({viewport:{width:390,height:844},reducedMotion:'no-preference'});
  const mobileErrors=[]; const mobileRequests=[];
  mobile.on('pageerror',e=>mobileErrors.push(String(e)));
  mobile.on('requestfailed',r=>{if(r.url().includes('cloudinary.com'))mobileRequests.push({url:r.url(),failure:r.failure()})});
  await mobile.goto(url,{waitUntil:'networkidle'});
  await waitForFilm(mobile);
  const mobileInitial=await mobile.evaluate(()=>{
    const s=document.querySelector('[data-movx-v116="film"]');
    const v=s.querySelector('video');
    const plane=s.querySelector('.into-signal-film__plane');
    return {mode:s.dataset.v116Mode,viewport:s.dataset.v116Viewport,duration:v.duration,readyState:v.readyState,networkState:v.networkState,canPlayH264:v.canPlayType('video/mp4; codecs="avc1.42E01E"'),src:v.currentSrc,display:getComputedStyle(v).display,sticky:getComputedStyle(s.querySelector('.into-signal-film__sticky')).position,planeWidth:plane.getBoundingClientRect().width,overflow:document.documentElement.scrollWidth-innerWidth};
  });
  if(mobileErrors.length||mobileRequests.length)throw Error(JSON.stringify({mobileErrors,mobileRequests,mobileInitial}));
  if(mobileInitial.mode!=='scrub'||mobileInitial.viewport!=='mobile'||mobileInitial.duration<4||mobileInitial.duration>6||!isCloudinary(mobileInitial.src)||mobileInitial.display==='none'||mobileInitial.sticky!=='sticky'||mobileInitial.overflow>2)throw Error(JSON.stringify({mobileInitial}));
  if(mobileInitial.planeWidth<370||mobileInitial.planeWidth>410)throw Error(JSON.stringify({mobilePlane:mobileInitial}));
  report.push({mobileInitial});
  const mm=await filmMetrics(mobile);
  const mobileStates=[];
  for(const [label,p] of [['signal',.18],['crossing',.50],['archive',.78],['handoff',.97]])mobileStates.push(await sample(mobile,mm,label,p,'mobile'));
  if(!(mobileStates[0].time<mobileStates[1].time&&mobileStates[1].time<mobileStates[2].time&&mobileStates[2].time<mobileStates[3].time))throw Error(JSON.stringify({mobileStates}));
  if(mobileStates[0].time>1.6)throw Error(JSON.stringify({mobileOpeningNotHeld:mobileStates[0]}));
  if(mobileStates[1].scale<1.25)throw Error(JSON.stringify({mobileCrossingNeedsDepth:mobileStates[1]}));
  if(mobileStates[3].handoff<.65||mobileStates[3].opacity>.35)throw Error(JSON.stringify({mobileHandoff:mobileStates[3]}));

  const reduced=await browser.newPage({viewport:{width:390,height:844},reducedMotion:'reduce'});
  await reduced.goto(url,{waitUntil:'networkidle'});
  const reducedState=await reduced.evaluate(()=>{
    const s=document.querySelector('[data-movx-v116="film"]');
    const v=s.querySelector('video');
    return {mode:s.dataset.v116Mode,src:v.getAttribute('src'),currentSrc:v.currentSrc,display:getComputedStyle(v).display,sticky:getComputedStyle(s.querySelector('.into-signal-film__sticky')).position,overflow:document.documentElement.scrollWidth-innerWidth};
  });
  if(reducedState.mode!=='static'||reducedState.src||reducedState.currentSrc||reducedState.display!=='none'||reducedState.sticky==='sticky'||reducedState.overflow>2)throw Error(JSON.stringify({reducedState}));
  report.push({reducedState});

  await fs.writeFile('_site/qa-v116-report.json',JSON.stringify(report,null,2));
  await browser.close();
  console.log('MOVX v116: Cloudinary H264 film scrubs in Google Chrome on desktop + mobile; CRT hold, crossing depth, archive handoff and reduced-motion fallback validated.');
})().catch(e=>{console.error(e);process.exit(1)});
