const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const path=require('node:path');

(async()=>{
  const browser=await chromium.launch({headless:true});
  try{
    const page=await browser.newPage({viewport:{width:1440,height:900},deviceScaleFactor:1});
    const errors=[];
    page.on('pageerror',error=>errors.push(error.message));
    await page.goto('http://127.0.0.1:4173/',{waitUntil:'networkidle'});
    const film=page.locator('[data-movx-scroll-world="v117"]');
    assert.equal(await film.count(),1);
    const seekTo=async p=>{
      await film.evaluate((element,value)=>window.scrollTo({top:element.getBoundingClientRect().top+window.scrollY+(element.offsetHeight-innerHeight)*value,behavior:'instant'}),p);
      await page.waitForFunction(value=>{
        const el=document.querySelector('[data-movx-scroll-world="v117"]');
        const v=el?.querySelector('video');
        const t=Number(el?.dataset.worldTarget||0);
        return el?.dataset.mode==='scrub'&&v?.src.startsWith('blob:')&&v.seekable.length>0&&Math.abs(v.currentTime-t)<.4&&Math.abs(Number(el.dataset.worldProgress)-value)<.03;
      },p,{timeout:15000}).catch(async error=>{
        const state=await film.evaluate(el=>({mode:el.dataset.mode,p:el.dataset.worldProgress,target:el.dataset.worldTarget,ready:el.dataset.frameReady,source:el.querySelector('video').currentSrc,time:el.querySelector('video').currentTime,seekable:el.querySelector('video').seekable.length,readyState:el.querySelector('video').readyState,error:el.querySelector('video').error?.message,canPlay:el.querySelector('video').canPlayType('video/mp4; codecs="avc1.640028"')}));
        throw new Error(`${error.message}\n${JSON.stringify(state)}`);
      });
    };
    await seekTo(.2);
    const first=await film.locator('video').evaluate(v=>v.currentTime);
    await page.screenshot({path:path.resolve('qa-v117-desktop.png')});
    await seekTo(.78);
    const last=await film.locator('video').evaluate(v=>v.currentTime);
    await page.screenshot({path:path.resolve('qa-v117-archive.png')});
    assert.ok(last>first+3,`scroll must advance the film: ${first} -> ${last}`);
    await seekTo(.3);
    const reverse=await film.locator('video').evaluate(v=>v.currentTime);
    assert.ok(reverse<last-2,'reverse scroll must rewind the film');
    assert.deepEqual(errors,[],'page errors');
    await page.close();

    const mobile=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true});
    await mobile.goto('http://127.0.0.1:4173/',{waitUntil:'networkidle'});
    const mobileFilm=mobile.locator('[data-movx-scroll-world="v117"]');
    await mobileFilm.scrollIntoViewIfNeeded();
    await mobile.waitForFunction(()=>{const w=document.querySelector('.movx-scroll-world__video')?.videoWidth;return w>700&&w<1000},null,{timeout:12000}).catch(async error=>{
      const state=await mobileFilm.evaluate(el=>({width:innerWidth,match:matchMedia('(max-width: 767px)').matches,mode:el.dataset.mode,source:el.querySelector('video').currentSrc,videoWidth:el.querySelector('video').videoWidth,error:el.querySelector('video').error?.message}));
      throw new Error(`${error.message}\n${JSON.stringify(state)}`);
    });
    assert.match(await mobileFilm.locator('video').evaluate(v=>v.currentSrc),/^blob:/);
    assert.equal(await mobileFilm.locator('video').evaluate(v=>getComputedStyle(v).objectFit),'contain');
    await mobileFilm.evaluate(element=>window.scrollTo({top:element.getBoundingClientRect().top+window.scrollY+(element.offsetHeight-innerHeight)*.32,behavior:'instant'}));
    await mobile.waitForFunction(()=>{
      const el=document.querySelector('[data-movx-scroll-world="v117"]');
      return Number(el?.dataset.worldProgress)>.3&&el.querySelector('video').currentTime>2;
    });
    await mobile.screenshot({path:path.resolve('qa-v117-mobile.png')});
    await mobile.close();

    const reduced=await browser.newPage({viewport:{width:1440,height:900},reducedMotion:'reduce'});
    await reduced.goto('http://127.0.0.1:4173/',{waitUntil:'networkidle'});
    assert.equal(await reduced.locator('[data-movx-scroll-world="v117"]').getAttribute('data-mode'),'fallback');
    assert.equal(await reduced.locator('.movx-scroll-world__video').getAttribute('src'),null);
    await reduced.close();
    console.log(JSON.stringify({status:'passed',forward:[first,last],reverse,mobile:'landscape contain',reduced:'poster'}));
  }finally{await browser.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
