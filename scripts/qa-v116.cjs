const {chromium}=require('playwright');
const fs=require('node:fs/promises');

(async()=>{
  const browser=await chromium.launch({headless:true});
  const report=[];
  const url='http://127.0.0.1:4173/social-media.html';

  const desktop=await browser.newPage({viewport:{width:1440,height:900},reducedMotion:'no-preference'});
  const errors=[]; desktop.on('pageerror',e=>errors.push(String(e)));
  await desktop.goto(url,{waitUntil:'networkidle'});
  await desktop.waitForSelector('[data-movx-v116="film"]');
  await desktop.waitForFunction(()=>{
    const v=document.querySelector('[data-movx-v116="film"] video');
    return v&&Number.isFinite(v.duration)&&v.duration>4;
  },null,{timeout:12000});

  const initial=await desktop.evaluate(()=>{
    const s=document.querySelector('[data-movx-v116="film"]');
    const v=s.querySelector('video');
    return {
      mode:s.dataset.v116Mode,
      duration:v.duration,
      src:v.currentSrc,
      hero:!!document.querySelector('.social-cover-art'),
      archive:!!document.querySelector('#livingArchive'),
      overflow:document.documentElement.scrollWidth-innerWidth,
      autoplay:v.autoplay,
      controls:v.controls
    };
  });
  if(errors.length)throw Error(JSON.stringify({errors}));
  if(initial.mode!=='scrub'||initial.duration<4||initial.duration>5||!initial.src.endsWith('into-signal-scroll.mp4'))throw Error(JSON.stringify({initial}));
  if(!initial.hero||!initial.archive||initial.overflow>2||initial.autoplay||initial.controls)throw Error(JSON.stringify({initial}));
  report.push({desktopInitial:initial});

  const metrics=await desktop.evaluate(()=>{
    const s=document.querySelector('[data-movx-v116="film"]');
    return {top:s.offsetTop,travel:Math.max(1,s.offsetHeight-innerHeight)};
  });
  for(const [label,p] of [['signal',.18],['crossing',.50],['archive',.78],['handoff',.97]]){
    await desktop.evaluate(y=>scrollTo(0,y),metrics.top+metrics.travel*p);
    await desktop.waitForTimeout(260);
    const state=await desktop.evaluate(()=>{
      const s=document.querySelector('[data-movx-v116="film"]');
      const v=s.querySelector('video');
      return {
        progress:Number(s.dataset.v116Progress||0),
        phase:s.dataset.v116Phase,
        time:v.currentTime,
        duration:v.duration,
        opacity:getComputedStyle(s).getPropertyValue('--v116-opacity').trim(),
        handoff:getComputedStyle(s).getPropertyValue('--v116-handoff').trim()
      };
    });
    report.push({label,state});
    await desktop.screenshot({path:`_site/qa-v116-${label}.png`,fullPage:false});
  }
  const states=report.filter(x=>x.state).map(x=>x.state);
  if(!(states[0].time<states[1].time&&states[1].time<states[2].time&&states[2].time<states[3].time))throw Error(JSON.stringify({states}));
  if(states[0].time>1.35)throw Error(JSON.stringify({openingNotHeld:states[0]}));
  if(Number(states[3].handoff)<.65||Number(states[3].opacity)>.35)throw Error(JSON.stringify({handoff:states[3]}));

  const mobile=await browser.newPage({viewport:{width:390,height:844},reducedMotion:'no-preference'});
  await mobile.goto(url,{waitUntil:'networkidle'});
  const mobileState=await mobile.evaluate(()=>{
    const s=document.querySelector('[data-movx-v116="film"]');
    const v=s.querySelector('video');
    return {mode:s.dataset.v116Mode,src:v.getAttribute('src'),currentSrc:v.currentSrc,display:getComputedStyle(v).display,sticky:getComputedStyle(s.querySelector('.into-signal-film__sticky')).position,overflow:document.documentElement.scrollWidth-innerWidth};
  });
  if(mobileState.mode!=='static'||mobileState.src||mobileState.currentSrc||mobileState.display!=='none'||mobileState.sticky==='sticky'||mobileState.overflow>2)throw Error(JSON.stringify({mobileState}));
  report.push({mobileState});
  await mobile.screenshot({path:'_site/qa-v116-mobile.png',fullPage:false});

  const reduced=await browser.newPage({viewport:{width:1280,height:900},reducedMotion:'reduce'});
  await reduced.goto(url,{waitUntil:'networkidle'});
  const reducedState=await reduced.evaluate(()=>{
    const s=document.querySelector('[data-movx-v116="film"]');
    const v=s.querySelector('video');
    return {mode:s.dataset.v116Mode,src:v.getAttribute('src'),currentSrc:v.currentSrc,display:getComputedStyle(v).display,sticky:getComputedStyle(s.querySelector('.into-signal-film__sticky')).position};
  });
  if(reducedState.mode!=='static'||reducedState.src||reducedState.currentSrc||reducedState.display!=='none'||reducedState.sticky==='sticky')throw Error(JSON.stringify({reducedState}));
  report.push({reducedState});

  await fs.writeFile('_site/qa-v116-report.json',JSON.stringify(report,null,2));
  await browser.close();
  console.log('MOVX v116: scroll-owned film, held CRT opening, progressive seek, archive handoff, mobile and reduced-motion fallbacks validated.');
})().catch(e=>{console.error(e);process.exit(1)});
