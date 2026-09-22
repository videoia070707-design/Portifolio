const {chromium}=require('playwright');
const fs=require('node:fs/promises');

(async()=>{
  const browser=await chromium.launch({headless:true});
  const page=await browser.newPage({viewport:{width:1440,height:900},reducedMotion:'no-preference'});
  const errors=[];page.on('pageerror',e=>errors.push(String(e)));
  const report=[];

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
      const title=document.querySelector('.v111-process-copy__title');
      const canvas=document.querySelector('#process .v108-process-canvas');
      const journey=document.querySelector('#process .v55-process-journey');
      const stepTitle=document.querySelector('.v111-process-copy__step-title');
      const stepText=document.querySelector('.v111-process-copy__step-text');
      const t=getComputedStyle(title),c=getComputedStyle(canvas),j=getComputedStyle(journey);
      return {
        step:Number(document.documentElement.dataset.movxV111Step||0),
        title:title.textContent,
        titleLines:title.textContent.split('\n').filter(Boolean).length,
        titleWhiteSpace:t.whiteSpace,
        canvasTransform:c.transform,
        canvasOpacity:parseFloat(c.opacity||'0'),
        canvasClip:c.clipPath||c.webkitClipPath||'',
        canvasMask:c.maskImage||c.webkitMaskImage||'',
        journeyBackground:j.backgroundImage,
        stepTitle:stepTitle.textContent.trim(),
        stepText:stepText.textContent.trim(),
        overflow:document.documentElement.scrollWidth-innerWidth
      };
    });
    const failures=[];
    if(state.title.includes('primeiroExecução')||state.titleLines<2)failures.push('intentional-title-break');
    if(state.titleWhiteSpace!=='pre-line')failures.push('title-whitespace');
    if(state.canvasTransform==='none')failures.push('canvas-scale-position');
    // v114.2 deliberately softens the final WebGL field to 0.46 so the 3D remains
    // visible without overpowering the editorial copy lane. Keep this legacy gate
    // aligned with the current visual owner instead of forcing the retired >= .50 rule.
    if(state.canvasOpacity<.42)failures.push('canvas-visible');
    if(!state.canvasClip.includes('50%'))failures.push('canvas-right-field');
    if(!state.canvasMask||state.canvasMask==='none')failures.push('canvas-soft-mask');
    if(!state.stepTitle||!state.stepText)failures.push('step-copy');
    if(state.overflow>2)failures.push('overflow');
    if(failures.length)throw Error(JSON.stringify({name,fraction,failures,state}));
    await page.screenshot({path:`_site/qa-v112-${name}.png`,fullPage:false});
    report.push({name,fraction,state});
    return state;
  }

  const start=await capture('process-start',.10);
  const mid=await capture('process-mid',.50);
  const end=await capture('process-end',.90);
  if(!(start.step<=2&&mid.step>=2&&mid.step<=4&&end.step>=4))throw Error(JSON.stringify({progression:[start.step,mid.step,end.step]}));

  if(errors.length)throw Error(errors.join('\n'));
  await fs.writeFile('_site/qa-v112-report.json',JSON.stringify(report,null,2));
  await browser.close();
  console.log('MOVX v112: intentional title breaks, softened/scaled 3D field, clean process copy and scroll progression validated.');
})().catch(e=>{console.error(e);process.exit(1)});
