const {chromium}=require('playwright');
const fs=require('node:fs/promises');

(async()=>{
  const browser=await chromium.launch({headless:true});
  const page=await browser.newPage({viewport:{width:1440,height:900},reducedMotion:'no-preference'});
  const errors=[]; page.on('pageerror',e=>errors.push(String(e)));
  const report=[];

  await page.goto('http://127.0.0.1:4173/social-media.html',{waitUntil:'networkidle'});
  await page.waitForFunction(()=>document.documentElement.dataset.movxV111==='cleanroom-ready',null,{timeout:9000});
  await page.waitForFunction(()=>document.documentElement.dataset.movxV114==='field-owned',null,{timeout:9000});
  await page.waitForFunction(()=>document.documentElement.dataset.v108Webgl==='ready',null,{timeout:9000});

  async function capture(name,fraction){
    const y=await page.evaluate(fraction=>{
      const el=document.querySelector('#process .v55-process-journey');
      const top=el.getBoundingClientRect().top+scrollY;
      return Math.round(top+Math.max(1,el.offsetHeight-innerHeight)*fraction);
    },fraction);
    await page.evaluate(y=>scrollTo({top:y,behavior:'instant'}),y);
    await page.waitForTimeout(560);

    const state=await page.evaluate(async()=>{
      const root=document.documentElement;
      const process=document.querySelector('#process.process-section');
      const journey=document.querySelector('#process .v55-process-journey');
      const canvas=document.querySelector('#process .v108-process-canvas');
      const atmosphere=document.querySelector('#process .v108-process-atmosphere');
      const title=document.querySelector('.v111-process-copy__title');
      const stepTitle=document.querySelector('.v111-process-copy__step-title');
      const stepText=document.querySelector('.v111-process-copy__step-text');
      const sourceTitle=document.querySelector('#process .process-title');
      const sourceList=document.querySelector('#process .process-list');
      const j=getComputedStyle(journey), c=getComputedStyle(canvas), a=getComputedStyle(atmosphere), t=getComputedStyle(title);
      const links=[...document.querySelectorAll('link[rel="stylesheet"]')];
      const v115Link=links.find(link=>link.href.includes('v115-process-owner.css'))||null;
      const bundleLink=links.find(link=>/\/movx-css-[^/?]+\.css(?:\?|$)/.test(link.href))||null;
      let v115Bundled=false;
      if(bundleLink){
        try{
          const css=await fetch(bundleLink.href,{cache:'force-cache'}).then(response=>response.ok?response.text():'');
          v115Bundled=css.includes('/* MOVX bundle source: v115-process-owner.css */');
        }catch{}
      }
      return {
        owner:root.dataset.movxV114,
        step:Number(root.dataset.movxV111Step||0),
        title:title.textContent,
        titleWhiteSpace:t.whiteSpace,
        titleBox:(()=>{const r=title.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height};})(),
        stepTitle:stepTitle.textContent.trim(),
        stepText:stepText.textContent.trim(),
        processBackground:getComputedStyle(process).backgroundColor,
        journeyBackground:j.background,
        journeyBackgroundColor:j.backgroundColor,
        journeyIsolation:j.isolation,
        v115Stylesheet:{
          href:v115Link?.href||bundleLink?.href||null,
          loaded:!!v115Link?.sheet||v115Bundled,
          direct:!!v115Link?.sheet,
          bundled:v115Bundled,
          links:links.map(link=>link.href).filter(href=>/v10[89]|v11[0125]|movx-css-/.test(href))
        },
        canvas:{
          display:c.display,
          opacity:parseFloat(c.opacity||'0'),
          inlineOpacity:canvas.style.getPropertyValue('opacity'),
          inlineOpacityPriority:canvas.style.getPropertyPriority('opacity'),
          transitionProperty:c.transitionProperty,
          transitionDuration:c.transitionDuration,
          transitionDelay:c.transitionDelay,
          animationName:c.animationName,
          animationDuration:c.animationDuration,
          transform:c.transform,
          transformOrigin:c.transformOrigin,
          clip:c.clipPath||c.webkitClipPath||'',
          mask:c.maskImage||c.webkitMaskImage||'',
          blend:c.mixBlendMode,
          background:c.backgroundColor,
          filter:c.filter
        },
        atmosphere:{background:a.background},
        sourceTitleOpacity:parseFloat(getComputedStyle(sourceTitle).opacity||'1'),
        sourceListOpacity:parseFloat(getComputedStyle(sourceList).opacity||'1'),
        overflow:document.documentElement.scrollWidth-innerWidth
      };
    });

    const failures=[];
    if(state.owner!=='field-owned')failures.push('runtime-owner');
    if(!state.title.includes('\n')||state.title.includes('primeiroExecução')||state.titleWhiteSpace!=='pre-line')failures.push('title-breaks');
    if(!state.stepTitle||!state.stepText)failures.push('step-copy');
    if(state.sourceTitleOpacity>.02||state.sourceListOpacity>.02)failures.push('legacy-copy-paint');
    if(state.journeyIsolation!=='isolate')failures.push('journey-isolation');
    if(!state.journeyBackground||state.journeyBackground==='none')failures.push('journey-background');
    if(!state.v115Stylesheet.loaded)failures.push('v115-stylesheet-loaded');
    if(state.canvas.display==='none'||state.canvas.opacity<.42||state.canvas.opacity>.50)failures.push('canvas-opacity-owner');
    if(state.canvas.transform==='none'||!state.canvas.transform.includes('0.72'))failures.push('canvas-scale-owner');
    if(!state.canvas.clip.includes('50%'))failures.push('canvas-right-field');
    if(!state.canvas.mask||state.canvas.mask==='none')failures.push('canvas-soft-mask');
    if(state.canvas.blend!=='normal')failures.push('canvas-blend');
    if(!['rgba(0, 0, 0, 0)','transparent'].includes(state.canvas.background))failures.push('canvas-transparent');
    if(!state.atmosphere.background||state.atmosphere.background==='none')failures.push('atmosphere-fade');
    if(state.overflow>2)failures.push('overflow');
    if(failures.length)throw Error(JSON.stringify({name,fraction,failures,state}));

    await page.screenshot({path:`_site/qa-v114-${name}.png`,fullPage:false});
    report.push({name,fraction,state});
    return state;
  }

  const start=await capture('process-start',.10);
  const mid=await capture('process-mid',.50);
  const end=await capture('process-end',.90);
  if(!(start.step<=2&&mid.step>=2&&mid.step<=4&&end.step>=4))throw Error(JSON.stringify({progression:[start.step,mid.step,end.step]}));

  const mobile=await browser.newPage({viewport:{width:390,height:844},reducedMotion:'no-preference'});
  await mobile.goto('http://127.0.0.1:4173/social-media.html',{waitUntil:'networkidle'});
  await mobile.waitForFunction(()=>document.documentElement.dataset.movxV111==='mobile-flow',null,{timeout:9000});
  const m=await mobile.evaluate(()=>({
    webgl:document.documentElement.dataset.v108Webgl,
    cleanroom:document.querySelectorAll('.v111-process-copy').length,
    sourceTitleOpacity:parseFloat(getComputedStyle(document.querySelector('#process .process-title')).opacity||'0'),
    visibleRows:[...document.querySelectorAll('#process .process-list>li')].filter(row=>getComputedStyle(row).visibility!=='hidden').length,
    overflow:document.documentElement.scrollWidth-innerWidth
  }));
  if(m.webgl!=='mobile-fallback'||m.cleanroom!==0||m.sourceTitleOpacity<.95||m.visibleRows<5||m.overflow>2)throw Error(JSON.stringify({mobile:m}));
  report.push({mobile:m});

  if(errors.length)throw Error(errors.join('\n'));
  await fs.writeFile('_site/qa-v114-report.json',JSON.stringify(report,null,2));
  await browser.close();
  console.log('MOVX v114.2: final runtime ownership, clean copy lane, visible neutral-blend WebGL field, scroll progression and mobile fallback validated.');
})().catch(e=>{console.error(e);process.exit(1)});
