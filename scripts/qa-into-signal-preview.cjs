const {chromium}=require('playwright');
const fs=require('node:fs/promises');

(async()=>{
  const browser=await chromium.launch({headless:true});
  const report=[];

  async function inspectPage(page,label){
    const errors=[]; page.on('pageerror',e=>errors.push(String(e)));
    await page.goto('http://127.0.0.1:4173/preview/into-the-signal.html',{waitUntil:'networkidle'});
    await page.waitForFunction(()=>[...document.images].every(img=>img.complete),null,{timeout:9000});
    const state=await page.evaluate(()=>({
      title:document.title,
      shots:[...document.querySelectorAll('[data-shot]')].map(node=>({id:node.dataset.shot,title:node.querySelector('h2')?.textContent?.trim()||''})),
      images:[...document.images].map(img=>({src:img.getAttribute('src'),width:img.naturalWidth,height:img.naturalHeight})),
      overflow:document.documentElement.scrollWidth-innerWidth,
      reduced:matchMedia('(prefers-reduced-motion: reduce)').matches,
      sticky:document.querySelector('.shot__sticky')?getComputedStyle(document.querySelector('.shot__sticky')).position:null
    }));
    if(errors.length)throw Error(JSON.stringify({label,errors}));
    if(state.shots.length!==3||state.shots.some(shot=>!shot.id||!shot.title))throw Error(JSON.stringify({label,shots:state.shots}));
    if(state.images.length<10||state.images.some(img=>img.width<20||img.height<20))throw Error(JSON.stringify({label,images:state.images}));
    if(state.overflow>2)throw Error(JSON.stringify({label,overflow:state.overflow}));
    report.push({label,state});
    return state;
  }

  const desktop=await browser.newPage({viewport:{width:1440,height:900},reducedMotion:'no-preference'});
  await inspectPage(desktop,'desktop');
  for(const id of ['01','02','03']){
    await desktop.locator(`[data-shot="${id}"]`).scrollIntoViewIfNeeded();
    await desktop.waitForTimeout(120);
    await desktop.screenshot({path:`_site/qa-into-signal-${id}.png`,fullPage:false});
  }

  const mobile=await browser.newPage({viewport:{width:390,height:844},reducedMotion:'no-preference'});
  await inspectPage(mobile,'mobile');
  await mobile.screenshot({path:'_site/qa-into-signal-mobile.png',fullPage:false});

  const reduced=await browser.newPage({viewport:{width:1280,height:900},reducedMotion:'reduce'});
  const reducedState=await inspectPage(reduced,'reduced');
  if(!reducedState.reduced||reducedState.sticky==='sticky')throw Error(JSON.stringify({reducedState}));

  await fs.writeFile('_site/qa-into-signal-report.json',JSON.stringify(report,null,2));
  await browser.close();
  console.log('MOVX Into the Signal: three-shot storyboard, real portfolio media, mobile flow, reduced motion and overflow validated.');
})().catch(e=>{console.error(e);process.exit(1)});
