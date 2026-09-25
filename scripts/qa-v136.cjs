const {chromium}=require('playwright');
const assert=require('node:assert/strict');

(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:1000},deviceScaleFactor:1,reducedMotion:'no-preference'});
  await page.addInitScript(()=>localStorage.setItem('movx-theme','dark'));
  await page.goto('http://127.0.0.1:4173/social-media.html',{waitUntil:'networkidle'});
  await page.waitForFunction(()=>{
    const r=document.documentElement.dataset;
    return r.movxV136==='fluid-morph' && ['ready','fallback'].includes(r.v136Webgl);
  },null,{timeout:12000});
  const hero=page.locator('.v136-fluid-hero');
  assert.equal(await hero.count(),1,'v136 must install exactly one fluid hero');
  assert.equal(await hero.locator('canvas').count(),1,'fluid hero must own one canvas');
  assert.equal(await hero.locator('.v136-fluid-state').count(),4,'fluid hero must expose four states');
  assert.equal(await page.locator('.social-cover-art__stage').evaluate(el=>getComputedStyle(el).display),'none','old static hero stage must be hidden');
  assert.ok(await page.locator('.hero-index').count()>=1,'existing hero index must remain');
  assert.ok(await page.locator('[data-movx-scroll-world="v117"]').count()>=1,'existing Scroll World must remain');
  const three=await page.request.get('http://127.0.0.1:4173/vendor/three.module.js');
  assert.equal(three.status(),200,'local Three.js module must exist');
  const meta=await page.evaluate(()=>({
    v137:document.documentElement.dataset.movxV137,
    material:document.documentElement.dataset.v137Material,
    webgl:document.documentElement.dataset.v136Webgl,
    geometry:document.documentElement.dataset.v136Geometry
  }));
  if(meta.webgl==='ready'){
    assert.equal(meta.v137,'reference-morph','v137 runtime must own the v136 compatibility surface');
    assert.equal(meta.material,'molten-orange-black-glass','v137 molten material marker missing');
    assert.equal(meta.geometry,'fixed-topology-5120','fixed topology marker missing');
  }
  const h=await hero.evaluate(el=>el.getBoundingClientRect().height);
  assert.ok(h>2500,'desktop fluid hero must provide enough scroll travel');
  if(meta.webgl==='ready'){
    for(const [ratio,expected] of [[0,'LIQUID'],[.30,'RING'],[.62,'TOWER'],[.96,'INFINITY']]){
      await hero.evaluate((el,r)=>{
        const top=el.getBoundingClientRect().top+scrollY;
        scrollTo({top:top+(el.offsetHeight-innerHeight)*r,behavior:'instant'});
      },ratio);
      await page.waitForFunction(exp=>document.documentElement.dataset.v136State===exp,expected,{timeout:1600});
      const state=await page.evaluate(()=>document.documentElement.dataset.v136State);
      assert.equal(state,expected,`state at ${ratio} should be ${expected}`);
    }
  }
  await page.setViewportSize({width:390,height:844});
  await page.reload({waitUntil:'networkidle'});
  await page.waitForFunction(()=>{
    const r=document.documentElement.dataset;
    return r.movxV136==='fluid-morph' && ['ready','fallback'].includes(r.v136Webgl);
  },null,{timeout:12000});
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
  assert.ok(overflow<=2,`v136 mobile must not create horizontal overflow (${overflow}px)`);
  console.log(JSON.stringify({qa:'v136-v137',status:'PASS',material:'orange-black-molten-glass',states:['LIQUID','RING','TOWER','INFINITY'],protected:['Scroll World','hero-index']}));
 } finally {await browser.close();}
})().catch(err=>{console.error(err);process.exit(1)});
