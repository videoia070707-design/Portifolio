const {chromium}=require('playwright');
const fs=require('node:fs/promises');

const rgb=s=>{const m=String(s||'').match(/rgba?\(([^)]+)\)/);if(!m)return null;const n=m[1].split(/[ ,/]+/).map(Number);return n.slice(0,3)};
const distance=(a,b)=>a&&b?Math.sqrt(a.reduce((sum,v,i)=>sum+(v-b[i])**2,0)):0;

(async()=>{
  const browser=await chromium.launch({headless:true});
  const report=[];
  const page=await browser.newPage({viewport:{width:1440,height:900},reducedMotion:'no-preference'});
  const errors=[];page.on('pageerror',e=>errors.push(String(e)));

  await page.goto('http://127.0.0.1:4173/social-media.html',{waitUntil:'networkidle'});
  await page.waitForFunction(()=>document.documentElement.dataset.movxV111==='cleanroom-ready',null,{timeout:9000});
  await page.waitForFunction(()=>document.documentElement.dataset.v108Webgl==='ready',null,{timeout:9000});

  async function capture(name,fraction){
    const y=await page.evaluate(fraction=>{
      const el=document.querySelector('#process .v55-process-journey');
      const top=el.getBoundingClientRect().top+scrollY;
      return Math.round(top+Math.max(1,el.offsetHeight-innerHeight)*fraction);
    },fraction);
    await page.evaluate(y=>scrollTo({top:y,behavior:'instant'}),y);
    await page.waitForTimeout(520);
    const state=await page.evaluate(()=>{
      const root=document.documentElement;
      const copy=document.querySelector('.v111-process-copy');
      const title=document.querySelector('.v111-process-copy__title');
      const step=document.querySelector('.v111-process-copy__step');
      const stepTitle=document.querySelector('.v111-process-copy__step-title');
      const stepText=document.querySelector('.v111-process-copy__step-text');
      const sourceTitle=document.querySelector('#process .process-title');
      const sourceList=document.querySelector('#process .process-list');
      const canvas=document.querySelector('#process .v108-process-canvas');
      const rect=el=>el?.getBoundingClientRect();
      const copyR=rect(copy),titleR=rect(title),stepR=rect(step),stepTitleR=rect(stepTitle),stepTextR=rect(stepText);
      const cs=el=>el?getComputedStyle(el):null;
      return {
        step:Number(root.dataset.movxV111Step||0),
        viewport:{w:innerWidth,h:innerHeight},
        copy:copyR?{left:copyR.left,right:copyR.right,top:copyR.top,bottom:copyR.bottom,width:copyR.width,height:copyR.height}:null,
        title:titleR?{left:titleR.left,right:titleR.right,top:titleR.top,bottom:titleR.bottom,width:titleR.width,height:titleR.height,text:title.textContent.trim(),color:cs(title).color}:null,
        stepBox:stepR?{left:stepR.left,right:stepR.right,top:stepR.top,bottom:stepR.bottom,width:stepR.width,height:stepR.height}:null,
        stepTitle:stepTitleR?{top:stepTitleR.top,bottom:stepTitleR.bottom,height:stepTitleR.height,text:stepTitle.textContent.trim(),color:cs(stepTitle).color}:null,
        stepText:stepTextR?{top:stepTextR.top,bottom:stepTextR.bottom,height:stepTextR.height,text:stepText.textContent.trim(),color:cs(stepText).color}:null,
        processBg:cs(document.querySelector('#process')).backgroundColor,
        sourceTitleOpacity:parseFloat(cs(sourceTitle).opacity||'1'),
        sourceListOpacity:parseFloat(cs(sourceList).opacity||'1'),
        canvas:{display:cs(canvas).display,opacity:parseFloat(cs(canvas).opacity||'0'),clip:cs(canvas).clipPath||cs(canvas).webkitClipPath||''},
        overlays:document.querySelectorAll('.v111-process-copy').length,
        overflow:document.documentElement.scrollWidth-innerWidth
      };
    });

    const failures=[];
    if(state.overlays!==1)failures.push('one-copy-owner');
    if(state.sourceTitleOpacity>.02||state.sourceListOpacity>.02)failures.push('legacy-copy-not-suppressed');
    if(!state.copy||state.copy.left<40||state.copy.right>state.viewport.w*.46||state.copy.top<90||state.copy.bottom>state.viewport.h-20)failures.push('copy-lane-bounds');
    if(!state.title||state.title.height<90||state.title.bottom>state.stepBox.top-36||!state.title.text)failures.push('title-readable');
    if(!state.stepBox||state.stepBox.top<state.viewport.h*.56||state.stepBox.bottom>state.viewport.h-18)failures.push('step-anchored');
    if(!state.stepTitle||state.stepTitle.height<22||!state.stepTitle.text||state.stepTitle.bottom>state.stepText.top-4)failures.push('step-title-readable');
    if(!state.stepText||state.stepText.height<18||!state.stepText.text||state.stepText.bottom>state.viewport.h-20)failures.push('step-copy-readable');
    if(distance(rgb(state.title.color),rgb(state.processBg))<90)failures.push('title-contrast');
    if(distance(rgb(state.stepTitle.color),rgb(state.processBg))<90)failures.push('step-title-contrast');
    if(state.canvas.display==='none'||state.canvas.opacity<.45||(!state.canvas.clip.includes('49%')&&!state.canvas.clip.includes('52%')))failures.push('3d-field-present');
    if(state.overflow>2)failures.push('overflow');
    if(failures.length)throw Error(JSON.stringify({name,fraction,failures,state}));
    await page.screenshot({path:`_site/qa-v111-${name}.png`,fullPage:false});
    report.push({name,fraction,state});
    return state;
  }

  const a=await capture('process-start',.10);
  const b=await capture('process-mid',.50);
  const c=await capture('process-end',.90);
  if(!(a.step<=2&&b.step>=2&&b.step<=4&&c.step>=4))throw Error(JSON.stringify({progression:[a.step,b.step,c.step]}));

  await page.evaluate(()=>document.documentElement.setAttribute('data-theme','dark'));
  await page.waitForTimeout(180);
  const dark=await page.evaluate(()=>{
    const title=document.querySelector('.v111-process-copy__title');
    const process=document.querySelector('#process');
    return {title:getComputedStyle(title).color,bg:getComputedStyle(process).backgroundColor};
  });
  if(distance(rgb(dark.title),rgb(dark.bg))<90)throw Error(JSON.stringify({darkContrast:dark}));
  report.push({dark});

  const mobile=await browser.newPage({viewport:{width:390,height:844},reducedMotion:'no-preference'});
  await mobile.goto('http://127.0.0.1:4173/social-media.html',{waitUntil:'networkidle'});
  await mobile.waitForFunction(()=>['mobile-flow','reduced-flow'].includes(document.documentElement.dataset.movxV111),null,{timeout:9000});
  const m=await mobile.evaluate(()=>{
    const copy=document.querySelector('.v111-process-copy');
    return {
      copyExists:!!copy,
      copyDisplay:copy?getComputedStyle(copy).display:null,
      sourceTitle:parseFloat(getComputedStyle(document.querySelector('#process .process-title')).opacity||'0'),
      rows:[...document.querySelectorAll('#process .process-list>li')].filter(row=>getComputedStyle(row).visibility!=='hidden').length,
      overflow:document.documentElement.scrollWidth-innerWidth
    };
  });
  if(m.copyExists&&m.copyDisplay!=='none')throw Error(JSON.stringify({mobileCopy:m}));
  if(m.sourceTitle<.95||m.rows<5||m.overflow>2)throw Error(JSON.stringify({mobile:m}));
  report.push({mobile:m});

  if(errors.length)throw Error(errors.join('\n'));
  await fs.writeFile('_site/qa-v111-report.json',JSON.stringify(report,null,2));
  await browser.close();
  console.log('MOVX v111: isolated process copy lane, visual separation, contrast, 3D field, progression and mobile fallback validated.');
})().catch(e=>{console.error(e);process.exit(1)});
