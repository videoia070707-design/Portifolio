const {chromium}=require('playwright');
const fs=require('node:fs/promises');

(async()=>{
  const browser=await chromium.launch({headless:true,executablePath:chromium.executablePath(),args:['--use-angle=swiftshader','--enable-webgl','--ignore-gpu-blocklist']});
  const report=[];
  const url='http://127.0.0.1:4173/social-media.html';
  const isLocalFilm=src=>/\/media\/movx-crt-scroll\.(?:mp4|webm)$/.test(src);
  const materialFailure=f=>f&&f.errorText&&!f.errorText.includes('ERR_ABORTED');

  async function open(viewport,reducedMotion='no-preference'){
    const page=await browser.newPage({viewport,reducedMotion});
    const errors=[],requests=[],mediaResponses=[]; let aborted=0;
    page.on('pageerror',e=>errors.push(String(e)));
    page.on('response',r=>{if(r.url().includes('/media/movx-crt-scroll.'))mediaResponses.push({url:r.url(),status:r.status(),contentType:r.headers()['content-type'],length:r.headers()['content-length']});});
    page.on('requestfailed',r=>{
      if(!r.url().includes('/media/movx-crt-scroll.'))return;
      const failure=r.failure();
      if(materialFailure(failure))requests.push({url:r.url(),failure});
      else if(failure?.errorText?.includes('ERR_ABORTED'))aborted++;
    });
    page.__errors=errors;page.__mediaResponses=mediaResponses;
    await page.goto(url,{waitUntil:'networkidle'});
    return {page,errors,requests,mediaResponses,getAborted:()=>aborted};
  }

  async function waitForFilm(page){
    await page.waitForSelector('[data-movx-v116="film"]');
    await page.locator('[data-movx-v116="film"]').scrollIntoViewIfNeeded();
    try{
      await page.waitForFunction(()=>{
        const s=document.querySelector('[data-movx-v116="film"]');
        const v=s?.querySelector('video');
        return s?.dataset.v116Mode==='scrub'&&v&&Number.isFinite(v.duration)&&v.duration>8;
      },null,{timeout:30000});
    }catch(error){
      const state=await page.evaluate(()=>{const s=document.querySelector('[data-movx-v116="film"]'),v=s?.querySelector('video');return {mode:s?.dataset.v116Mode,mediaReady:s?.dataset.v116MediaReady,src:v?.getAttribute('src'),currentSrc:v?.currentSrc,duration:v?.duration,readyState:v?.readyState,networkState:v?.networkState,error:v?.error?{code:v.error.code,message:v.error.message}:null,videoWidth:v?.videoWidth,videoHeight:v?.videoHeight,progress:s?.dataset.v116Progress,viewport:innerWidth};});
      throw new Error(`v116 media did not become playable: ${JSON.stringify({state,errors:page.__errors||[],mediaResponses:page.__mediaResponses||[]})}; ${error.message}`);
    }
  }

  async function metrics(page){
    return page.evaluate(()=>{const s=document.querySelector('[data-movx-v116="film"]');return {top:s.offsetTop,travel:Math.max(1,s.offsetHeight-innerHeight)}});
  }

  async function sample(page,m,label,p,prefix){
    await page.evaluate(y=>scrollTo(0,y),m.top+m.travel*p);
    await page.waitForTimeout(620);
    const state=await page.evaluate(()=>{
      const s=document.querySelector('[data-movx-v116="film"]'),v=s.querySelector('video'),css=getComputedStyle(s);
      return {progress:Number(s.dataset.v116Progress||0),phase:s.dataset.v116Phase,time:v.currentTime,duration:v.duration,readyState:v.readyState,scale:Number(css.getPropertyValue('--v116-scale').trim()||1),opacity:Number(css.getPropertyValue('--v116-opacity').trim()||1),handoff:Number(css.getPropertyValue('--v116-handoff').trim()||0)};
    });
    report.push({prefix,label,state});
    await page.screenshot({path:`_site/qa-v116-${prefix}-${label}.png`,fullPage:false});
    return state;
  }

  // Desktop — source, metadata, sticky surface and real temporal scrub.
  const d=await open({width:1440,height:900});
  await waitForFilm(d.page);
  const desktopInitial=await d.page.evaluate(()=>{
    const s=document.querySelector('[data-movx-v116="film"]'),v=s.querySelector('video');
    const src=v.currentSrc;return {mode:s.dataset.v116Mode,viewport:s.dataset.v116Viewport,duration:v.duration,canPlayFilm:src.endsWith('.webm')?v.canPlayType('video/webm; codecs="vp9"'):v.canPlayType('video/mp4; codecs="avc1.42E01E"'),src,hero:!!document.querySelector('.social-cover-art'),archive:!!document.querySelector('#livingArchive'),overflow:document.documentElement.scrollWidth-innerWidth,autoplay:v.autoplay,controls:v.controls,sticky:getComputedStyle(s.querySelector('.into-signal-film__sticky')).position};
  });
  if(d.errors.length||d.requests.length)throw Error(JSON.stringify({desktopErrors:d.errors,desktopRequests:d.requests,desktopInitial}));
  if(desktopInitial.mode!=='scrub'||desktopInitial.viewport!=='desktop'||desktopInitial.duration<8||desktopInitial.duration>12||!desktopInitial.canPlayFilm||!isLocalFilm(desktopInitial.src)||!desktopInitial.hero||!desktopInitial.archive||desktopInitial.overflow>2||desktopInitial.autoplay||desktopInitial.controls||desktopInitial.sticky!=='sticky')throw Error(JSON.stringify({desktopInitial}));
  report.push({desktopInitial,normalRangeAborts:d.getAborted()});
  const dm=await metrics(d.page),ds=[];
  for(const [label,p] of [['signal',.18],['crossing',.50],['archive',.78],['handoff',.97]])ds.push(await sample(d.page,dm,label,p,'desktop'));
  if(!(ds[0].time<ds[1].time&&ds[1].time<ds[2].time&&ds[2].time<ds[3].time))throw Error(JSON.stringify({desktopNonMonotonic:ds}));
  if(ds[0].time>2.1||ds[3].handoff<.65||ds[3].opacity>.35)throw Error(JSON.stringify({desktopTiming:ds}));

  // Mobile — same temporal scrub, sticky surface, viewport-width base plane,
  // plus an intentional transformed zoom during Crossing.
  const m=await open({width:390,height:844});
  await waitForFilm(m.page);
  const mobileInitial=await m.page.evaluate(()=>{
    const s=document.querySelector('[data-movx-v116="film"]'),v=s.querySelector('video'),plane=s.querySelector('.into-signal-film__plane'),pcs=getComputedStyle(plane);
    const src=v.currentSrc;return {mode:s.dataset.v116Mode,viewport:s.dataset.v116Viewport,duration:v.duration,canPlayFilm:src.endsWith('.webm')?v.canPlayType('video/webm; codecs="vp9"'):v.canPlayType('video/mp4; codecs="avc1.42E01E"'),src,display:getComputedStyle(v).display,sticky:getComputedStyle(s.querySelector('.into-signal-film__sticky')).position,planeCssWidth:parseFloat(pcs.width),planeRenderedWidth:plane.getBoundingClientRect().width,overflow:document.documentElement.scrollWidth-innerWidth};
  });
  if(m.errors.length||m.requests.length)throw Error(JSON.stringify({mobileErrors:m.errors,mobileRequests:m.requests,mobileInitial}));
  if(mobileInitial.mode!=='scrub'||mobileInitial.viewport!=='mobile'||mobileInitial.duration<8||mobileInitial.duration>12||!mobileInitial.canPlayFilm||!isLocalFilm(mobileInitial.src)||mobileInitial.display==='none'||mobileInitial.sticky!=='sticky'||mobileInitial.overflow>2)throw Error(JSON.stringify({mobileInitial}));
  if(mobileInitial.planeCssWidth<370||mobileInitial.planeCssWidth>410)throw Error(JSON.stringify({mobileBasePlane:mobileInitial}));
  report.push({mobileInitial,normalRangeAborts:m.getAborted()});
  const mm=await metrics(m.page),ms=[];
  for(const [label,p] of [['signal',.18],['crossing',.50],['archive',.78],['handoff',.97]])ms.push(await sample(m.page,mm,label,p,'mobile'));
  if(!(ms[0].time<ms[1].time&&ms[1].time<ms[2].time&&ms[2].time<ms[3].time))throw Error(JSON.stringify({mobileNonMonotonic:ms}));
  if(ms[0].time>2.1||ms[1].scale<1.25||ms[3].handoff<.65||ms[3].opacity>.35)throw Error(JSON.stringify({mobileTiming:ms}));

  // Accessibility fallback — no movie download when motion is explicitly reduced.
  const r=await open({width:390,height:844},'reduce');
  const reducedState=await r.page.evaluate(()=>{
    const s=document.querySelector('[data-movx-v116="film"]'),v=s.querySelector('video');
    return {mode:s.dataset.v116Mode,src:v.getAttribute('src'),currentSrc:v.currentSrc,display:getComputedStyle(v).display,sticky:getComputedStyle(s.querySelector('.into-signal-film__sticky')).position,overflow:document.documentElement.scrollWidth-innerWidth};
  });
  if(reducedState.mode!=='static'||reducedState.src||reducedState.currentSrc||reducedState.display!=='none'||reducedState.sticky==='sticky'||reducedState.overflow>2)throw Error(JSON.stringify({reducedState}));
  report.push({reducedState});

  await fs.writeFile('_site/qa-v116-report.json',JSON.stringify(report,null,2));
  await browser.close();
  console.log('MOVX v116: local H264 film scrubs in Chromium on desktop + mobile; CRT hold, Crossing zoom, archive handoff and reduced-motion fallback validated.');
})().catch(e=>{console.error(e);process.exit(1)});
