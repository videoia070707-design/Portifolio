const {chromium}=require('playwright');
const fs=require('node:fs/promises');

(async()=>{
  const browser=await chromium.launch({headless:true});
  const page=await browser.newPage({viewport:{width:820,height:1040},reducedMotion:'no-preference'});
  const errors=[]; page.on('pageerror',e=>errors.push(String(e)));
  const report=[];

  const inspect=()=>page.evaluate(()=>{
    const root=document.documentElement;
    const title=document.querySelector('#process .process-title');
    const list=document.querySelector('#process .process-list');
    const canvas=document.querySelector('#process .v108-process-canvas');
    return {
      mode:root.dataset.movxV115,
      webgl:root.dataset.v108Webgl,
      overlayCount:document.querySelectorAll('#process .v111-process-copy').length,
      titleOpacity:parseFloat(getComputedStyle(title).opacity||'0'),
      listOpacity:parseFloat(getComputedStyle(list).opacity||'0'),
      canvasDisplay:getComputedStyle(canvas).display,
      overflow:document.documentElement.scrollWidth-innerWidth
    };
  });

  await page.goto('http://127.0.0.1:4173/social-media.html',{waitUntil:'networkidle'});
  await page.waitForFunction(()=>document.documentElement.dataset.v108Webgl==='mobile-fallback',null,{timeout:8000});
  await page.waitForFunction(()=>document.documentElement.dataset.movxV115==='flow-fallback',null,{timeout:5000});
  await page.waitForTimeout(100);
  const mobileFirst=await inspect();
  if(mobileFirst.overlayCount!==0||mobileFirst.titleOpacity<.95||mobileFirst.listOpacity<.95||mobileFirst.canvasDisplay!=='none'||mobileFirst.overflow>2)throw Error(JSON.stringify({mobileFirst}));
  report.push({mobileFirst});

  await page.setViewportSize({width:1440,height:900});
  await page.waitForFunction(()=>document.documentElement.dataset.movxV115==='field-fallback',null,{timeout:5000});
  await page.waitForTimeout(140);
  const widened=await inspect();
  if(widened.webgl!=='mobile-fallback'||widened.overlayCount!==0||widened.titleOpacity<.95||widened.listOpacity<.95||widened.canvasDisplay!=='none'||widened.overflow>2)throw Error(JSON.stringify({widened}));
  report.push({widened});

  await page.setViewportSize({width:820,height:1040});
  await page.waitForFunction(()=>document.documentElement.dataset.movxV115==='flow-fallback',null,{timeout:5000});
  await page.waitForTimeout(100);
  const narrowedAgain=await inspect();
  if(narrowedAgain.overlayCount!==0||narrowedAgain.titleOpacity<.95||narrowedAgain.listOpacity<.95||narrowedAgain.overflow>2)throw Error(JSON.stringify({narrowedAgain}));
  report.push({narrowedAgain});

  if(errors.length)throw Error(errors.join('\n'));
  await fs.writeFile('_site/qa-v115-mobile-first-report.json',JSON.stringify(report,null,2));
  await page.screenshot({path:'_site/qa-v115-mobile-first.png',fullPage:false});
  await browser.close();
  console.log('MOVX v115.1: mobile-first -> desktop -> mobile stays readable and never exposes an uninitialized 3D field.');
})().catch(e=>{console.error(e);process.exit(1)});
