const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const path=require('node:path');

(async()=>{
  const browser=await chromium.launch({headless:true});
  try{
    const page=await browser.newPage({viewport:{width:1440,height:900},deviceScaleFactor:1});
    const errors=[];
    const mediaRequests=[];
    page.on('pageerror',error=>errors.push(error.message));
    page.on('request',request=>{if(/movx-scroll-world-0923(?:-mobile)?\.(?:mp4|webm)/.test(request.url()))mediaRequests.push(request.url())});
    await page.goto('http://127.0.0.1:4173/',{waitUntil:'networkidle'});
    const film=page.locator('[data-movx-scroll-world="v117"]');
    assert.equal(await film.count(),1);
    assert.equal(await film.locator('[data-world-chapter-panel]').count(),4,'Scroll World must expose four real scroll chapters');
    assert.equal(await film.locator('.movx-scroll-world__sticky').evaluate(el=>getComputedStyle(el).position),'sticky','film must remain a sticky background');
    assert.equal(await film.locator('video').evaluate(v=>getComputedStyle(v).objectFit),'cover','desktop film must cover the viewport as a background');
    assert.equal(await film.locator('video').getAttribute('src'),null,'Scroll World video must not compete with first-view loading');
    const initialMediaRequests=mediaRequests.length;
    assert.equal(initialMediaRequests,0,'Scroll World media must stay idle before the chapter reaches the viewport');

    const seekTo=async p=>{
      await film.evaluate((element,value)=>window.scrollTo({top:element.getBoundingClientRect().top+window.scrollY+(element.offsetHeight-innerHeight)*value,behavior:'instant'}),p);
      await page.waitForFunction(value=>{
        const el=document.querySelector('[data-movx-scroll-world="v117"]');
        const v=el?.querySelector('video');
        const t=Number(el?.dataset.worldTarget||0);
        return el?.dataset.mode==='scrub'&&v?.currentSrc&&v.seekable.length>0&&Math.abs(v.currentTime-t)<.4&&Math.abs(Number(el.dataset.worldProgress)-value)<.03;
      },p,{timeout:18000}).catch(async error=>{
        const state=await film.evaluate(el=>({mode:el.dataset.mode,p:el.dataset.worldProgress,target:el.dataset.worldTarget,chapter:el.dataset.worldChapter,codec:el.dataset.mediaCodec,ready:el.dataset.frameReady,source:el.querySelector('video').currentSrc,time:el.querySelector('video').currentTime,seekable:el.querySelector('video').seekable.length,readyState:el.querySelector('video').readyState,error:el.querySelector('video').error?.message,canMp4:el.querySelector('video').canPlayType('video/mp4'),canWebM:el.querySelector('video').canPlayType('video/webm; codecs="vp9"')}));
        throw new Error(`${error.message}\n${JSON.stringify(state)}`);
      });
    };

    await seekTo(.12);
    const desktopSource=await film.locator('video').evaluate(v=>v.currentSrc);
    const desktopCodec=await film.getAttribute('data-media-codec');
    assert.ok(desktopSource.startsWith('blob:'),'desktop must use the deferred Blob source for reliable scrub seeking');
    assert.match(desktopCodec||'',/^(vp9-webm|h264-mp4)$/,'desktop must record the negotiated optimized codec');
    const desktopMediaPattern=desktopCodec==='vp9-webm'?/movx-scroll-world-0923\.webm/:/movx-scroll-world-0923\.mp4/;
    assert.ok(mediaRequests.some(url=>desktopMediaPattern.test(url)),'desktop optimized source must be fetched only after engagement');
    const first=await film.locator('video').evaluate(v=>v.currentTime);
    assert.ok(first>0,'desktop scrub must move away from frame zero');
    assert.equal(await film.getAttribute('data-world-chapter'),'1');
    await page.screenshot({path:path.resolve('qa-v117-desktop.png')});

    await seekTo(.62);
    const middle=await film.locator('video').evaluate(v=>v.currentTime);
    assert.equal(await film.getAttribute('data-world-chapter'),'3','chapter counter must follow scroll progress');
    await page.screenshot({path:path.resolve('qa-v117-chapter-3.png')});

    await seekTo(.86);
    const last=await film.locator('video').evaluate(v=>v.currentTime);
    assert.equal(await film.getAttribute('data-world-chapter'),'4');
    await page.screenshot({path:path.resolve('qa-v117-archive.png')});
    assert.ok(middle>first+2,`scroll must advance the film through sections: ${first} -> ${middle}`);
    assert.ok(last>middle+1,`later section must keep advancing the film: ${middle} -> ${last}`);

    await seekTo(.3);
    const reverse=await film.locator('video').evaluate(v=>v.currentTime);
    assert.ok(reverse<last-2,'reverse scroll must rewind the film');
    assert.equal(await film.getAttribute('data-world-chapter'),'2');
    assert.deepEqual(errors,[],'page errors');
    await page.close();

    const mobile=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true});
    await mobile.goto('http://127.0.0.1:4173/',{waitUntil:'networkidle'});
    const mobileFilm=mobile.locator('[data-movx-scroll-world="v117"]');
    assert.equal(await mobileFilm.locator('[data-world-chapter-panel]').count(),4);
    assert.equal(await mobileFilm.locator('video').getAttribute('src'),null,'mobile video must stay idle above the fold');
    await mobileFilm.scrollIntoViewIfNeeded();
    await mobile.waitForFunction(()=>{const w=document.querySelector('.movx-scroll-world__video')?.videoWidth;return w>700&&w<1000},null,{timeout:15000}).catch(async error=>{
      const state=await mobileFilm.evaluate(el=>({width:innerWidth,match:matchMedia('(max-width: 767px)').matches,mode:el.dataset.mode,codec:el.dataset.mediaCodec,source:el.querySelector('video').currentSrc,videoWidth:el.querySelector('video').videoWidth,error:el.querySelector('video').error?.message}));
      throw new Error(`${error.message}\n${JSON.stringify(state)}`);
    });
    const mobileSource=await mobileFilm.locator('video').evaluate(v=>v.currentSrc);
    assert.ok(mobileSource.startsWith('blob:'),'mobile must keep the deferred Blob strategy');
    assert.equal(await mobileFilm.locator('video').evaluate(v=>getComputedStyle(v).objectFit),'contain');
    await mobileFilm.evaluate(element=>window.scrollTo({top:element.getBoundingClientRect().top+window.scrollY+(element.offsetHeight-innerHeight)*.58,behavior:'instant'}));
    await mobile.waitForFunction(()=>{
      const el=document.querySelector('[data-movx-scroll-world="v117"]');
      return Number(el?.dataset.worldProgress)>.55&&el.querySelector('video').currentTime>2&&Number(el.dataset.worldChapter)>=3;
    });
    await mobile.screenshot({path:path.resolve('qa-v117-mobile.png')});
    await mobile.close();

    const reduced=await browser.newPage({viewport:{width:1440,height:900},reducedMotion:'reduce'});
    await reduced.goto('http://127.0.0.1:4173/',{waitUntil:'networkidle'});
    const reducedFilm=reduced.locator('[data-movx-scroll-world="v117"]');
    assert.equal(await reducedFilm.getAttribute('data-mode'),'fallback');
    assert.equal(await reducedFilm.locator('.movx-scroll-world__video').getAttribute('src'),null);
    assert.equal(await reducedFilm.locator('[data-world-chapter-panel]').count(),4,'reduced motion keeps the multi-section structure over the poster');
    await reduced.close();
    console.log(JSON.stringify({status:'passed',initialMediaRequests,chapters:4,desktopCodec,desktopSource,forward:[first,middle,last],reverse,mobileSource,reduced:'poster + chapters'}));
  }finally{await browser.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
