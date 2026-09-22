const {chromium}=require('playwright');
const fs=require('node:fs/promises');

(async()=>{
  const browser=await chromium.launch({headless:true});
  const report=[];
  const page=await browser.newPage({viewport:{width:1440,height:900},reducedMotion:'no-preference'});
  const errors=[];
  page.on('pageerror',e=>errors.push(String(e)));

  await page.goto('http://127.0.0.1:4173/social-media.html',{waitUntil:'networkidle'});
  await page.waitForFunction(()=>document.documentElement.dataset.movxV108==='institutional-depth');
  await page.waitForFunction(()=>['ready','fallback'].includes(document.documentElement.dataset.v108Webgl),null,{timeout:8000});

  async function capture(name,fraction){
    const target=await page.evaluate(fraction=>{
      const el=document.querySelector('#process .v55-process-journey');
      const top=el.getBoundingClientRect().top+scrollY;
      const travel=Math.max(1,el.offsetHeight-innerHeight);
      return Math.round(top+travel*fraction);
    },fraction);
    await page.evaluate(y=>scrollTo({top:y,behavior:'instant'}),target);
    await page.waitForTimeout(450);

    const state=await page.evaluate(()=>{
      const h2=document.querySelector('#process .process-title h2');
      const title=document.querySelector('#process .process-title');
      const active=document.querySelector('#process .process-list li.v108-process-active');
      const strong=active?.querySelector('strong');
      const paragraph=active?.querySelector('p');
      const canvas=document.querySelector('#process .v108-process-canvas');
      const box=el=>el?.getBoundingClientRect();
      const style=el=>el?getComputedStyle(el):null;
      const h2Box=box(h2),titleBox=box(title),activeBox=box(active),strongBox=box(strong),pBox=box(paragraph);
      const h2Style=style(h2),activeStyle=style(active),strongStyle=style(strong),pStyle=style(paragraph),canvasStyle=style(canvas);
      return {
        viewport:{width:innerWidth,height:innerHeight},
        step:Number(document.documentElement.dataset.movxProcessStep||0),
        visibleRows:[...document.querySelectorAll('#process .process-list li')].filter(row=>{
          const cs=getComputedStyle(row);return cs.visibility!=='hidden'&&parseFloat(cs.opacity)>.15;
        }).length,
        activeRows:document.querySelectorAll('#process .process-list li.v108-process-active').length,
        titleBox:titleBox?{left:titleBox.left,right:titleBox.right,top:titleBox.top,bottom:titleBox.bottom,width:titleBox.width,height:titleBox.height}:null,
        h2Box:h2Box?{left:h2Box.left,right:h2Box.right,top:h2Box.top,bottom:h2Box.bottom,width:h2Box.width,height:h2Box.height}:null,
        activeBox:activeBox?{left:activeBox.left,right:activeBox.right,top:activeBox.top,bottom:activeBox.bottom,width:activeBox.width,height:activeBox.height}:null,
        strongBox:strongBox?{left:strongBox.left,right:strongBox.right,top:strongBox.top,bottom:strongBox.bottom,width:strongBox.width,height:strongBox.height}:null,
        pBox:pBox?{left:pBox.left,right:pBox.right,top:pBox.top,bottom:pBox.bottom,width:pBox.width,height:pBox.height}:null,
        h2:{display:h2Style?.display,visibility:h2Style?.visibility,opacity:parseFloat(h2Style?.opacity||'0'),color:h2Style?.color,textFill:h2Style?.webkitTextFillColor,filter:h2Style?.filter,clip:h2Style?.clipPath},
        active:{visibility:activeStyle?.visibility,opacity:parseFloat(activeStyle?.opacity||'0'),transform:activeStyle?.transform,pseudoBefore:getComputedStyle(active,'::before').display,pseudoAfter:getComputedStyle(active,'::after').display},
        strong:{visibility:strongStyle?.visibility,opacity:parseFloat(strongStyle?.opacity||'0'),color:strongStyle?.color,textFill:strongStyle?.webkitTextFillColor},
        paragraph:{visibility:pStyle?.visibility,opacity:parseFloat(pStyle?.opacity||'0'),color:pStyle?.color,textFill:pStyle?.webkitTextFillColor},
        clipPath:canvasStyle?.clipPath||canvasStyle?.webkitClipPath||'',
        canvasOpacity:parseFloat(canvasStyle?.opacity||'0'),
        canvasDisplay:canvasStyle?.display,
        overflow:document.documentElement.scrollWidth-innerWidth
      };
    });

    const transparent=v=>!v||v==='rgba(0, 0, 0, 0)'||v==='transparent';
    const {viewport}=state;
    const failures=[];
    if(state.visibleRows!==1||state.activeRows!==1)failures.push('single-active-row');
    if(!state.h2Box||state.h2Box.height<70||state.h2Box.top<90||state.h2Box.bottom>viewport.height*.64)failures.push('title-in-viewport');
    if(state.h2.display==='none'||state.h2.visibility==='hidden'||state.h2.opacity<.95||transparent(state.h2.color)||transparent(state.h2.textFill))failures.push('title-visible-style');
    if(!state.activeBox||state.activeBox.top<viewport.height*.55||state.activeBox.bottom>viewport.height-24||state.activeBox.right>viewport.width*.43)failures.push('active-row-anchored');
    if(!state.strongBox||state.strongBox.top<0||state.strongBox.bottom>viewport.height||state.strongBox.height<22||state.strong.visibility==='hidden'||state.strong.opacity<.95||transparent(state.strong.color)||transparent(state.strong.textFill))failures.push('active-title-visible');
    if(!state.pBox||state.pBox.top<0||state.pBox.bottom>viewport.height||state.pBox.height<18||state.paragraph.visibility==='hidden'||state.paragraph.opacity<.95||transparent(state.paragraph.color)||transparent(state.paragraph.textFill))failures.push('active-copy-visible');
    if(state.active.pseudoBefore!=='none'||state.active.pseudoAfter!=='none')failures.push('legacy-pseudo-hidden');
    if(!state.clipPath.includes('50%')&& !state.clipPath.includes('52%'))failures.push('3d-clipped-right');
    if(state.canvasDisplay==='none'||state.canvasOpacity<.55)failures.push('3d-visible');
    if(state.overflow>2)failures.push('horizontal-overflow');
    if(state.h2Box&&state.activeBox&&state.h2Box.bottom>state.activeBox.top-18)failures.push('title-step-overlap');
    if(failures.length)throw Error(JSON.stringify({name,fraction,failures,state}));

    await page.screenshot({path:`_site/qa-v110-${name}.png`,fullPage:false});
    report.push({name,fraction,state});
    return state;
  }

  const start=await capture('process-start',.10);
  const mid=await capture('process-mid',.50);
  const end=await capture('process-end',.90);
  if(!(start.step<=2&&mid.step>=2&&mid.step<=4&&end.step>=4))throw Error(JSON.stringify({stepProgression:{start:start.step,mid:mid.step,end:end.step}}));

  const mobile=await browser.newPage({viewport:{width:390,height:844},reducedMotion:'no-preference'});
  await mobile.goto('http://127.0.0.1:4173/social-media.html',{waitUntil:'networkidle'});
  await mobile.waitForFunction(()=>document.documentElement.dataset.movxV108==='institutional-depth');
  await mobile.waitForTimeout(340);
  const m=await mobile.evaluate(()=>({
    webgl:document.documentElement.dataset.v108Webgl,
    canvas:getComputedStyle(document.querySelector('#process .v108-process-canvas')).display,
    visibleRows:[...document.querySelectorAll('#process .process-list li')].filter(row=>getComputedStyle(row).visibility!=='hidden').length,
    listPosition:getComputedStyle(document.querySelector('#process .process-list')).position,
    overflow:document.documentElement.scrollWidth-innerWidth
  }));
  if(m.webgl!=='mobile-fallback'||m.canvas!=='none'||m.visibleRows<5||m.listPosition==='absolute'||m.overflow>2)throw Error(JSON.stringify({mobile:m}));
  report.push({mobile:m});

  const reducedPage=await browser.newPage({viewport:{width:1280,height:900},reducedMotion:'reduce'});
  await reducedPage.goto('http://127.0.0.1:4173/social-media.html',{waitUntil:'networkidle'});
  await reducedPage.waitForFunction(()=>document.documentElement.dataset.movxV108==='institutional-depth');
  await reducedPage.waitForTimeout(300);
  const r=await reducedPage.evaluate(()=>({
    webgl:document.documentElement.dataset.v108Webgl,
    canvas:getComputedStyle(document.querySelector('#process .v108-process-canvas')).display,
    visibleRows:[...document.querySelectorAll('#process .process-list li')].filter(row=>getComputedStyle(row).visibility!=='hidden').length,
    overflow:document.documentElement.scrollWidth-innerWidth
  }));
  if(r.webgl!=='reduced'||r.canvas!=='none'||r.visibleRows<5||r.overflow>2)throw Error(JSON.stringify({reduced:r}));
  report.push({reduced:r});

  if(errors.length)throw Error(errors.join('\n'));
  await fs.writeFile('_site/qa-v110-report.json',JSON.stringify(report,null,2));
  await browser.close();
  console.log('MOVX v110: Process title/copy legibility, anchored single-step lane, separated 3D field, mobile and reduced-motion fallbacks validated.');
})().catch(e=>{console.error(e);process.exit(1)});
