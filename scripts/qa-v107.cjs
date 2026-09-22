const {chromium}=require('playwright');
const fs=require('node:fs/promises');
(async()=>{
  const browser=await chromium.launch({headless:true});
  const report=[];
  const page=await browser.newPage({viewport:{width:1440,height:900},reducedMotion:'no-preference'});
  const errors=[];page.on('pageerror',e=>errors.push(String(e)));
  await page.goto('http://127.0.0.1:4173/social-media.html',{waitUntil:'networkidle'});
  await page.waitForTimeout(700);

  const initial=await page.evaluate(()=>{
    const root=document.documentElement,section=document.querySelector('.v107-dimensional-story');
    const sticky=section?.querySelector('.v107-dimensional-story__sticky');
    const canvas=section?.querySelector('canvas');
    return {
      version:root.dataset.movxV107,
      webgl:root.dataset.v107Webgl,
      section:!!section,
      sectionHeight:section?.getBoundingClientRect().height||0,
      viewportHeight:innerHeight,
      stickyPosition:sticky?getComputedStyle(sticky).position:null,
      canvas:!!canvas,
      canvasBox:canvas?canvas.getBoundingClientRect().toJSON():null,
      overflow:root.scrollWidth-innerWidth
    };
  });
  if(initial.version!=='scroll-sculpture'||!initial.section||initial.sectionHeight<initial.viewportHeight*1.7||initial.stickyPosition!=='sticky'||initial.overflow>2)throw Error(JSON.stringify({initial}));
  if(!['ready','fallback'].includes(initial.webgl))throw Error(JSON.stringify({webgl:initial.webgl}));

  async function capture(name,fraction){
    const target=await page.evaluate(f=>{
      const section=document.querySelector('.v107-dimensional-story');
      const top=section.getBoundingClientRect().top+scrollY;
      const travel=Math.max(1,section.offsetHeight-innerHeight);
      return Math.round(top+travel*f);
    },fraction);
    await page.evaluate(y=>scrollTo({top:y,behavior:'instant'}),target);
    await page.waitForTimeout(420);
    const state=await page.evaluate(()=>{
      const sticky=document.querySelector('.v107-dimensional-story__sticky');
      return {
        progress:parseFloat(getComputedStyle(sticky).getPropertyValue('--v107-progress'))||0,
        canvasOpacity:parseFloat(getComputedStyle(document.querySelector('.v107-dimensional-story__canvas')).opacity)||0,
        viewportOverflow:document.documentElement.scrollWidth-innerWidth,
        webgl:document.documentElement.dataset.v107Webgl
      };
    });
    if(state.viewportOverflow>2)throw Error(JSON.stringify({name,state}));
    await page.screenshot({path:`_site/qa-v107-3d-${name}.png`,fullPage:false});
    report.push({name,fraction,state});
    return state;
  }
  const a=await capture('assemble',.18);
  const b=await capture('turn',.50);
  const c=await capture('focus-x',.78);
  if(!(a.progress<b.progress&&b.progress<c.progress&&c.progress>.68))throw Error(JSON.stringify({a,b,c}));

  const mobile=await browser.newPage({viewport:{width:390,height:844},reducedMotion:'no-preference'});
  await mobile.goto('http://127.0.0.1:4173/social-media.html',{waitUntil:'networkidle'});
  await mobile.waitForTimeout(300);
  const m=await mobile.evaluate(()=>({
    webgl:document.documentElement.dataset.v107Webgl,
    fallback:getComputedStyle(document.querySelector('.v107-dimensional-story__fallback')).display,
    canvas:getComputedStyle(document.querySelector('.v107-dimensional-story__canvas')).display,
    overflow:document.documentElement.scrollWidth-innerWidth
  }));
  if(m.webgl!=='mobile-fallback'||m.fallback==='none'||m.canvas!=='none'||m.overflow>2)throw Error(JSON.stringify({mobile:m}));
  report.push({mobile:m});

  const reduced=await browser.newPage({viewport:{width:1280,height:900},reducedMotion:'reduce'});
  await reduced.goto('http://127.0.0.1:4173/social-media.html',{waitUntil:'networkidle'});
  await reduced.waitForTimeout(260);
  const r=await reduced.evaluate(()=>({
    webgl:document.documentElement.dataset.v107Webgl,
    fallback:getComputedStyle(document.querySelector('.v107-dimensional-story__fallback')).display,
    canvas:getComputedStyle(document.querySelector('.v107-dimensional-story__canvas')).display,
    overflow:document.documentElement.scrollWidth-innerWidth
  }));
  if(r.webgl!=='reduced'||r.fallback==='none'||r.canvas!=='none'||r.overflow>2)throw Error(JSON.stringify({reduced:r}));
  report.push({reduced:r});

  if(errors.length)throw Error(errors.join('\n'));
  await fs.writeFile('_site/qa-v107-report.json',JSON.stringify({initial,report},null,2));
  await browser.close();
  console.log('MOVX v107: visible WebGL scroll sculpture, phase progression and fallbacks validated.');
})().catch(e=>{console.error(e);process.exit(1)});
