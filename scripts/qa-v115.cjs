const {chromium}=require('playwright');
const fs=require('node:fs/promises');

(async()=>{
  const browser=await chromium.launch({headless:true});
  const page=await browser.newPage({viewport:{width:1440,height:900},reducedMotion:'no-preference'});
  const errors=[]; page.on('pageerror',e=>errors.push(String(e)));
  const report=[];

  await page.goto('http://127.0.0.1:4173/social-media.html',{waitUntil:'networkidle'});
  await page.waitForFunction(()=>document.documentElement.dataset.movxV115==='adaptive-owner',null,{timeout:9000});

  const inspect=()=>page.evaluate(()=>{
    const root=document.documentElement;
    const process=document.querySelector('#process.process-section');
    const journey=document.querySelector('#process .v55-process-journey');
    const grid=document.querySelector('#process .process-grid');
    const title=document.querySelector('#process .process-title');
    const list=document.querySelector('#process .process-list');
    const canvas=document.querySelector('#process .v108-process-canvas');
    const overlay=document.querySelector('#process .v111-process-copy');
    const row=document.querySelector('#process .process-list>li');
    return {
      mode:root.dataset.movxV115,
      v111:root.dataset.movxV111,
      v114:root.dataset.movxV114,
      webgl:root.dataset.v108Webgl,
      overlayCount:document.querySelectorAll('#process .v111-process-copy').length,
      overlayDisplay:overlay?getComputedStyle(overlay).display:'missing',
      titleOpacity:parseFloat(getComputedStyle(title).opacity||'0'),
      listOpacity:parseFloat(getComputedStyle(list).opacity||'0'),
      canvasDisplay:getComputedStyle(canvas).display,
      canvasOpacity:parseFloat(getComputedStyle(canvas).opacity||'0'),
      canvasInlineOpacity:canvas.style.getPropertyValue('opacity'),
      canvasInlineOpacityPriority:canvas.style.getPropertyPriority('opacity'),
      gridInlinePosition:grid.style.getPropertyValue('position'),
      gridInlinePositionPriority:grid.style.getPropertyPriority('position'),
      listInlinePosition:list.style.getPropertyValue('position'),
      listInlinePositionPriority:list.style.getPropertyPriority('position'),
      rowInlinePosition:row.style.getPropertyValue('position'),
      rowInlinePositionPriority:row.style.getPropertyPriority('position'),
      processHeight:process.getBoundingClientRect().height,
      journeyHeight:journey.getBoundingClientRect().height,
      overflow:document.documentElement.scrollWidth-innerWidth
    };
  });

  const assertOwnedOpacity=(state,label)=>{
    const inline=parseFloat(state.canvasInlineOpacity||'NaN');
    if(state.canvasInlineOpacityPriority!=='important'||!Number.isFinite(inline)||inline<0||inline>.46||Math.abs(inline-state.canvasOpacity)>.02){
      throw Error(JSON.stringify({[label]:state,reason:'adaptive-opacity-owner'}));
    }
  };

  const desktop=await inspect();
  if(desktop.mode!=='adaptive-owner'||desktop.overlayCount!==1||desktop.titleOpacity>.02||desktop.listOpacity>.02)throw Error(JSON.stringify({desktop}));
  if(desktop.canvasDisplay==='none'||desktop.canvasOpacity<.40||desktop.canvasOpacity>.50)throw Error(JSON.stringify({desktopCanvas:desktop}));
  assertOwnedOpacity(desktop,'desktopOpacity');
  if(desktop.overflow>2)throw Error(JSON.stringify({desktopOverflow:desktop}));
  report.push({desktop});

  await page.setViewportSize({width:820,height:1040});
  await page.waitForFunction(()=>document.documentElement.dataset.movxV115==='flow-fallback',null,{timeout:5000});
  await page.waitForTimeout(120);
  const mobileAfterDesktop=await inspect();
  if(mobileAfterDesktop.overlayCount!==0||mobileAfterDesktop.titleOpacity<.95||mobileAfterDesktop.listOpacity<.95||mobileAfterDesktop.canvasDisplay!=='none')throw Error(JSON.stringify({mobileAfterDesktop}));
  if(mobileAfterDesktop.canvasInlineOpacityPriority)throw Error(JSON.stringify({staleSurfaceOwner:mobileAfterDesktop}));
  if(mobileAfterDesktop.gridInlinePositionPriority||mobileAfterDesktop.listInlinePositionPriority||mobileAfterDesktop.rowInlinePositionPriority)throw Error(JSON.stringify({staleInlineGeometry:mobileAfterDesktop}));
  if(mobileAfterDesktop.overflow>2)throw Error(JSON.stringify({mobileOverflow:mobileAfterDesktop}));
  report.push({mobileAfterDesktop});

  await page.setViewportSize({width:1440,height:900});
  await page.waitForFunction(()=>document.documentElement.dataset.movxV115==='adaptive-owner',null,{timeout:5000});
  await page.waitForTimeout(120);
  const desktopAgain=await inspect();
  if(desktopAgain.overlayCount!==1||desktopAgain.titleOpacity>.02||desktopAgain.listOpacity>.02||desktopAgain.canvasDisplay==='none')throw Error(JSON.stringify({desktopAgain}));
  assertOwnedOpacity(desktopAgain,'desktopAgainOpacity');
  report.push({desktopAgain});

  await page.emulateMedia({reducedMotion:'reduce'});
  await page.waitForFunction(()=>document.documentElement.dataset.movxV115==='flow-fallback',null,{timeout:5000});
  await page.waitForTimeout(120);
  const reduced=await inspect();
  if(reduced.overlayCount!==0||reduced.titleOpacity<.95||reduced.listOpacity<.95||reduced.canvasDisplay!=='none')throw Error(JSON.stringify({reduced}));
  if(reduced.canvasInlineOpacityPriority)throw Error(JSON.stringify({reducedSurfaceOwner:reduced}));
  if(reduced.gridInlinePositionPriority||reduced.listInlinePositionPriority||reduced.rowInlinePositionPriority)throw Error(JSON.stringify({reducedInlineGeometry:reduced}));
  report.push({reduced});

  await page.emulateMedia({reducedMotion:'no-preference'});
  await page.waitForFunction(()=>document.documentElement.dataset.movxV115==='adaptive-owner',null,{timeout:5000});
  await page.waitForTimeout(120);
  const restored=await inspect();
  if(restored.overlayCount!==1||restored.titleOpacity>.02||restored.listOpacity>.02)throw Error(JSON.stringify({restored}));
  assertOwnedOpacity(restored,'restoredOpacity');
  report.push({restored});

  if(errors.length)throw Error(errors.join('\n'));
  await page.screenshot({path:'_site/qa-v115-adaptive-process.png',fullPage:false});
  await fs.writeFile('_site/qa-v115-report.json',JSON.stringify(report,null,2));
  await browser.close();
  console.log('MOVX v115.5: adaptive desktop/mobile/reduced-motion Process ownership validated with one v115 surface owner and no stale fallback styles.');
})().catch(e=>{console.error(e);process.exit(1)});
