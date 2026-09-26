const { chromium } = require('playwright');
const fs = require('fs');

(async()=>{
  const browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-webgl','--ignore-gpu-blocklist']});
  const page=await browser.newPage({viewport:{width:1440,height:1000},deviceScaleFactor:1});
  const errors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
  await page.goto('http://127.0.0.1:4173/',{waitUntil:'domcontentloaded',timeout:120000});
  await page.waitForFunction(()=>document.documentElement.dataset.modelFraming==='v324-model-framing',{timeout:30000});

  const expected={
    'hero-movx-logo':[140000,160000],
    'x-portal':[95000,115000],
    'creative-machine':[135000,155000],
    'play-camera':[145000,165000],
    'play-cube':[138000,158000],
    'spatial-studio':[175000,195000]
  };
  const report={};
  for(const [slot,range] of Object.entries(expected)){
    const loc=page.locator(`[data-model-slot="${slot}"]`).first();
    if(await loc.count()!==1)throw new Error(`Missing slot ${slot}`);
    await loc.scrollIntoViewIfNeeded();
    await page.waitForTimeout(350);
    await page.waitForFunction((name)=>{
      const i=window.MOVX3D?.runtime?.instances?.[name];
      return !!(i?.loaded||i?.error);
    },slot,{timeout:90000});
    const info=await page.evaluate((name)=>{
      const i=window.MOVX3D.runtime.instances[name];
      return {loaded:i.loaded,error:i.error||null,stats:i.stats||null,tuned:!!i.v324Tuned,glbState:i.element.dataset.glbState,framing:i.element.dataset.modelFraming||null};
    },slot);
    if(info.error)throw new Error(`${slot} GLB failed: ${info.error}`);
    if(!info.loaded)throw new Error(`${slot} did not load`);
    if(!info.tuned||info.framing!=='v324')throw new Error(`${slot} framing was not applied`);
    const tris=info.stats?.triangles||0;
    if(tris<range[0]||tris>range[1])throw new Error(`${slot} triangles ${tris} outside expected ${range[0]}-${range[1]}`);
    report[slot]=info;
    await loc.screenshot({path:`_site/qa-v324-${slot}.png`});
  }
  if(errors.length)throw new Error('Browser errors: '+JSON.stringify(errors));
  fs.writeFileSync('_site/qa-v324-model-report.json',JSON.stringify({status:'passed',report},null,2));
  await browser.close();
  console.log(JSON.stringify({status:'passed',slots:Object.keys(report)}));
})().catch(async err=>{console.error(err);process.exit(1)});
