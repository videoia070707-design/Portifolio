const {chromium}=require('playwright');
const assert=require('node:assert/strict');

(async()=>{
  const browser=await chromium.launch({headless:true});
  try{
    const page=await browser.newPage({viewport:{width:1440,height:900},deviceScaleFactor:1});
    await page.goto('http://127.0.0.1:4173/',{waitUntil:'networkidle'});
    const film=page.locator('[data-movx-scroll-world="v117"]');
    const plane=film.locator('.movx-scroll-world__plane');
    const sticky=film.locator('.movx-scroll-world__sticky');
    assert.equal(await film.getAttribute('data-spatial-mode'),'camera-3d','Scroll World must declare the v125 camera 3D owner');
    assert.equal(await plane.evaluate(el=>getComputedStyle(el).transformStyle),'preserve-3d','film plane must keep a 3D transform context');
    assert.notEqual(await sticky.evaluate(el=>getComputedStyle(el).perspective),'none','sticky stage must expose perspective');

    const seek=async p=>{
      await film.evaluate((el,value)=>window.scrollTo({top:el.getBoundingClientRect().top+scrollY+(el.offsetHeight-innerHeight)*value,behavior:'instant'}),p);
      await page.waitForFunction(value=>{
        const el=document.querySelector('[data-movx-scroll-world="v117"]');
        return el?.dataset.spatialMode==='camera-3d'&&Math.abs(Number(el.dataset.worldProgress)-value)<.025;
      },p,{timeout:8000});
      return film.evaluate(el=>({
        p:Number(el.dataset.worldProgress),
        z:Number(el.dataset.worldDepth),
        scale:Number(el.dataset.worldScale),
        rx:Number(el.dataset.worldRotateX),
        ry:Number(el.dataset.worldRotateY),
        rz:Number(el.dataset.worldRotateZ),
        transform:getComputedStyle(el.querySelector('.movx-scroll-world__plane')).transform
      }));
    };

    const intro=await seek(.08);
    const arc=await seek(.56);
    const dive=await seek(.80);
    assert.ok(intro.z<-55,`intro must begin behind the camera plane: ${JSON.stringify(intro)}`);
    assert.ok(arc.z>intro.z+100,`camera must travel substantially through Z space: ${intro.z} -> ${arc.z}`);
    assert.ok(Math.abs(arc.ry-intro.ry)>4,`camera arc must visibly rotate in Y: ${intro.ry} -> ${arc.ry}`);
    assert.ok(dive.scale>arc.scale+.45,`fly-through must enlarge the world, not leave it flat: ${arc.scale} -> ${dive.scale}`);
    assert.ok(dive.z>130,`fly-through must push the film toward the viewer: ${dive.z}`);
    assert.notEqual(intro.transform,arc.transform,'3D transform must change between intro and arc');
    assert.notEqual(arc.transform,dive.transform,'3D transform must change again during the dive');
    await page.screenshot({path:'_site/qa-v123-spatial-dive.png'});
    await page.close();

    const mobile=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true});
    await mobile.goto('http://127.0.0.1:4173/',{waitUntil:'networkidle'});
    const mobileFilm=mobile.locator('[data-movx-scroll-world="v117"]');
    await mobileFilm.evaluate(el=>window.scrollTo({top:el.getBoundingClientRect().top+scrollY+(el.offsetHeight-innerHeight)*.78,behavior:'instant'}));
    await mobile.waitForFunction(()=>{const el=document.querySelector('[data-movx-scroll-world="v117"]');return Number(el?.dataset.worldProgress)>.75},null,{timeout:8000});
    const mobileState=await mobileFilm.evaluate(el=>({z:Number(el.dataset.worldDepth),scale:Number(el.dataset.worldScale),ry:Number(el.dataset.worldRotateY)}));
    assert.ok(mobileState.z>80&&mobileState.scale>1.6,`mobile must preserve a real spatial fly-through: ${JSON.stringify(mobileState)}`);
    await mobile.screenshot({path:'_site/qa-v123-spatial-mobile.png'});
    await mobile.close();

    console.log(JSON.stringify({status:'passed',spatial:'camera-3d scroll camera',intro,arc,dive,mobile:mobileState}));
  }finally{await browser.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
