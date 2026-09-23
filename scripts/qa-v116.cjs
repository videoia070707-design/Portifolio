const {chromium}=require('playwright');
const fs=require('node:fs/promises');

(async()=>{
  const browser=await chromium.launch({headless:true,executablePath:chromium.executablePath(),args:['--use-angle=swiftshader','--enable-webgl','--ignore-gpu-blocklist']});
  const report=[];
  const url='http://127.0.0.1:4173/social-media.html';
  const cloudinary='https://res.cloudinary.com/gp3xbngz/video/upload/v1790173902/0923.mp4';
  const isFilmUrl=u=>u===cloudinary||/\/media\/movx-crt-scroll\.(?:mp4|webm)$/.test(u);
  const isAcceptedMode=m=>['cloudinary-blob','cloudinary-direct','local-fallback'].includes(m);
  const materialFailure=f=>f&&f.errorText&&!f.errorText.includes('ERR_ABORTED');

  async function persist(){
    await fs.writeFile('_site/qa-v116-report.json',JSON.stringify(report,null,2));
  }

  async function open(viewport,reducedMotion='no-preference'){
    const page=await browser.newPage({viewport,reducedMotion});
    const errors=[],localFailures=[],remoteFailures=[],mediaResponses=[]; let aborted=0;
    page.on('pageerror',e=>errors.push(String(e)));
    page.on('response',r=>{
      if(isFilmUrl(r.url()))mediaResponses.push({url:r.url(),status:r.status(),contentType:r.headers()['content-type'],length:r.headers()['content-length']});
    });
    page.on('requestfailed',r=>{
      if(!isFilmUrl(r.url()))return;
      const failure=r.failure();
      if(failure?.errorText?.includes('ERR_ABORTED')){aborted++;return;}
      if(materialFailure(failure)){
        const item={url:r.url(),failure};
        if(r.url()===cloudinary)remoteFailures.push(item); else localFailures.push(item);
      }
    });
    page.__errors=errors;page.__mediaResponses=mediaResponses;
    await page.goto(url,{waitUntil:'networkidle'});
    return {page,errors,localFailures,remoteFailures,mediaResponses,getAborted:()=>aborted};
  }

  async function waitForFilm(page){
    await page.waitForSelector('[data-movx-v116="film"]');
    await page.locator('[data-movx-v116="film"]').scrollIntoViewIfNeeded();
    try{
      await page.waitForFunction(()=>{
        const s=document.querySelector('[data-movx-v116="film"]');
        const v=s?.querySelector('video');
        return s?.dataset.v116Mode==='scrub'&&v&&Number.isFinite(v.duration)&&v.duration>1;
      },null,{timeout:30000});
    }catch(error){
      const state=await page.evaluate(()=>{
        const s=document.querySelector('[data-movx-v116="film"]'),v=s?.querySelector('video');
        return {
          mode:s?.dataset.v116Mode,
          sourceMode:s?.dataset.v116Source,
          declared:v?.dataset.srcCloudinary,
          mediaReady:s?.dataset.v116MediaReady,
          src:v?.getAttribute('src'),
          currentSrc:v?.currentSrc,
          duration:v?.duration,
          readyState:v?.readyState,
          networkState:v?.networkState,
          error:v?.error?{code:v.error.code,message:v.error.message}:null,
          progress:s?.dataset.v116Progress,
          viewport:innerWidth
        };
      });
      throw new Error(`Scroll World film did not become playable: ${JSON.stringify({state,errors:page.__errors||[],mediaResponses:page.__mediaResponses||[]})}; ${error.message}`);
    }
  }

  async function metrics(page){
    return page.evaluate(()=>{const s=document.querySelector('[data-movx-v116="film"]');return {top:s.offsetTop,travel:Math.max(1,s.offsetHeight-innerHeight)};});
  }

  async function sample(page,m,label,p,prefix){
    await page.evaluate(y=>scrollTo(0,y),m.top+m.travel*p);
    await page.waitForTimeout(760);
    const state=await page.evaluate(()=>{
      const s=document.querySelector('[data-movx-v116="film"]'),v=s.querySelector('video'),css=getComputedStyle(s);
      return {
        progress:Number(s.dataset.v116Progress||0),
        phase:s.dataset.v116Phase,
        sourceMode:s.dataset.v116Source,
        time:v.currentTime,
        target:Number(s.dataset.v116Target||0),
        duration:v.duration,
        readyState:v.readyState,
        seeking:v.seeking,
        scale:Number(css.getPropertyValue('--v116-scale').trim()||1),
        z:parseFloat(css.getPropertyValue('--v116-z').trim()||0),
        opacity:Number(css.getPropertyValue('--v116-opacity').trim()||1),
        handoff:Number(css.getPropertyValue('--v116-handoff').trim()||0)
      };
    });
    report.push({prefix,label,state});
    await page.screenshot({path:`_site/qa-v116-${prefix}-${label}.png`,fullPage:false});
    await persist();
    return state;
  }

  async function initialState(page){
    return page.evaluate(()=>{
      const s=document.querySelector('[data-movx-v116="film"]'),v=s.querySelector('video'),plane=s.querySelector('.into-signal-film__plane'),pcs=getComputedStyle(plane);
      return {
        mode:s.dataset.v116Mode,
        viewport:s.dataset.v116Viewport,
        sourceMode:s.dataset.v116Source,
        declaredCloudinary:v.dataset.srcCloudinary,
        duration:v.duration,
        src:v.currentSrc,
        display:getComputedStyle(v).display,
        hero:!!document.querySelector('.social-cover-art'),
        archive:!!document.querySelector('#livingArchive'),
        overflow:document.documentElement.scrollWidth-innerWidth,
        autoplay:v.autoplay,
        controls:v.controls,
        sticky:getComputedStyle(s.querySelector('.into-signal-film__sticky')).position,
        planeCssWidth:parseFloat(pcs.width),
        planeRenderedWidth:plane.getBoundingClientRect().width
      };
    });
  }

  // Desktop — canonical Cloudinary declaration, playable source, sticky stage and temporal scrub.
  const d=await open({width:1440,height:900});
  await waitForFilm(d.page);
  const desktopInitial=await initialState(d.page);
  if(d.errors.length||d.localFailures.length)throw Error(JSON.stringify({desktopErrors:d.errors,desktopLocalFailures:d.localFailures,desktopRemoteFailures:d.remoteFailures,desktopInitial}));
  if(desktopInitial.mode!=='scrub'||desktopInitial.viewport!=='desktop'||desktopInitial.duration<=1||desktopInitial.duration>60||desktopInitial.declaredCloudinary!==cloudinary||!isAcceptedMode(desktopInitial.sourceMode)||!desktopInitial.hero||!desktopInitial.archive||desktopInitial.overflow>2||desktopInitial.autoplay||desktopInitial.controls||desktopInitial.sticky!=='sticky')throw Error(JSON.stringify({desktopInitial}));
  report.push({desktopInitial,remoteFailures:d.remoteFailures,normalRangeAborts:d.getAborted()});
  await persist();

  const dm=await metrics(d.page),ds=[];
  for(const [label,p] of [['signal',.18],['crossing',.50],['archive',.78],['handoff',.97]])ds.push(await sample(d.page,dm,label,p,'desktop'));
  await persist();
  if(!(ds[0].time<ds[1].time&&ds[1].time<ds[2].time&&ds[2].time<ds[3].time))throw Error(JSON.stringify({desktopNonMonotonic:ds}));
  if(ds[3].handoff<.60||ds[3].opacity>.40||ds[0].z>=ds[2].z)throw Error(JSON.stringify({desktopTiming:ds}));

  // Mobile — same scrub with a stronger spatial Crossing.
  const m=await open({width:390,height:844});
  await waitForFilm(m.page);
  const mobileInitial=await initialState(m.page);
  if(m.errors.length||m.localFailures.length)throw Error(JSON.stringify({mobileErrors:m.errors,mobileLocalFailures:m.localFailures,mobileRemoteFailures:m.remoteFailures,mobileInitial}));
  if(mobileInitial.mode!=='scrub'||mobileInitial.viewport!=='mobile'||mobileInitial.duration<=1||mobileInitial.duration>60||mobileInitial.declaredCloudinary!==cloudinary||!isAcceptedMode(mobileInitial.sourceMode)||mobileInitial.display==='none'||mobileInitial.sticky!=='sticky'||mobileInitial.overflow>2)throw Error(JSON.stringify({mobileInitial}));
  if(mobileInitial.planeCssWidth<370||mobileInitial.planeCssWidth>410)throw Error(JSON.stringify({mobileBasePlane:mobileInitial}));
  report.push({mobileInitial,remoteFailures:m.remoteFailures,normalRangeAborts:m.getAborted()});
  await persist();

  const mm=await metrics(m.page),ms=[];
  for(const [label,p] of [['signal',.18],['crossing',.50],['archive',.78],['handoff',.97]])ms.push(await sample(m.page,mm,label,p,'mobile'));
  await persist();
  if(!(ms[0].time<ms[1].time&&ms[1].time<ms[2].time&&ms[2].time<ms[3].time))throw Error(JSON.stringify({mobileNonMonotonic:ms}));
  if(ms[1].scale<1.20||ms[3].handoff<.60||ms[3].opacity>.40)throw Error(JSON.stringify({mobileTiming:ms}));

  // Accessibility fallback — static poster and zero film source/download under reduced motion.
  const r=await open({width:390,height:844},'reduce');
  const reducedState=await r.page.evaluate(()=>{
    const s=document.querySelector('[data-movx-v116="film"]'),v=s.querySelector('video');
    return {mode:s.dataset.v116Mode,sourceMode:s.dataset.v116Source,declaredCloudinary:v.dataset.srcCloudinary,src:v.getAttribute('src'),currentSrc:v.currentSrc,display:getComputedStyle(v).display,sticky:getComputedStyle(s.querySelector('.into-signal-film__sticky')).position,overflow:document.documentElement.scrollWidth-innerWidth};
  });
  if(reducedState.mode!=='static'||reducedState.sourceMode!=='idle'||reducedState.declaredCloudinary!==cloudinary||reducedState.src||reducedState.currentSrc||reducedState.display!=='none'||reducedState.sticky==='sticky'||reducedState.overflow>2)throw Error(JSON.stringify({reducedState}));
  report.push({reducedState});

  await persist();
  await browser.close();
  console.log('MOVX Scroll World: Cloudinary 0923.mp4 is canonical, blob/direct playback scrubs on desktop + mobile, 3D depth/handoff and reduced-motion fallback validated.');
})().catch(e=>{console.error(e);process.exit(1)});
