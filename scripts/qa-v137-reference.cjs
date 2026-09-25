const {chromium}=require('playwright');
const assert=require('node:assert/strict');

(async()=>{
 const browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-webgl','--ignore-gpu-blocklist']});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:1000},deviceScaleFactor:1,reducedMotion:'no-preference'});
  await page.addInitScript(()=>localStorage.setItem('movx-theme','dark'));
  await page.goto('http://127.0.0.1:4173/social-media.html',{waitUntil:'domcontentloaded',timeout:30000});
  await page.waitForFunction(()=>document.documentElement.dataset.movxV138==='reference-morph-v2',null,{timeout:15000});
  await page.waitForFunction(()=>document.documentElement.dataset.v136Webgl==='ready',null,{timeout:15000});
  const meta=await page.evaluate(()=>({
   material:document.documentElement.dataset.v138Material,
   geometry:document.documentElement.dataset.v136Geometry,
   design:document.documentElement.dataset.v136Design,
   state:document.documentElement.dataset.v136State,
   canvas:!!document.querySelector('.v136-fluid-hero__canvas')
  }));
  assert.equal(meta.material,'molten-black-glass-orange-veins');
  assert.ok(/^fixed-topology-\d+$/.test(meta.geometry),'fixed topology marker missing');
  assert.equal(meta.design,'orange-black-molten-glass-reference-v2');
  assert.ok(meta.canvas);
  const hero=page.locator('.v136-fluid-hero');
  const states=[[0,'LIQUID','liquid'],[.30,'RING','ring'],[.62,'TOWER','tower'],[.96,'INFINITY','infinity']];
  for(const [ratio,expected,file] of states){
   await hero.evaluate((el,r)=>{
    const top=el.getBoundingClientRect().top+scrollY;
    scrollTo({top:top+(el.offsetHeight-innerHeight)*r,behavior:'instant'});
   },ratio);
   await page.waitForFunction(exp=>document.documentElement.dataset.v136State===exp,expected,{timeout:3000});
   await page.waitForTimeout(1050);
   await page.screenshot({path:`_site/qa-v138-${file}.png`,fullPage:false});
  }
  console.log(JSON.stringify({qa:'v138-reference',status:'PASS',meta,states:states.map(x=>x[1])}));
 } finally {await browser.close()}
})().catch(err=>{console.error(err);process.exit(1)});
