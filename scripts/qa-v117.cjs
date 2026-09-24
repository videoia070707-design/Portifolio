const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const path=require('node:path');

const pixelMetric=async locator=>locator.evaluate(media=>{
  const width=media.videoWidth||media.naturalWidth||0;
  const height=media.videoHeight||media.naturalHeight||0;
  if(!width||!height)return {mean:0,brightRatio:0,width,height};
  const canvas=document.createElement('canvas');
  canvas.width=64;canvas.height=36;
  const ctx=canvas.getContext('2d',{willReadFrequently:true});
  ctx.drawImage(media,0,0,64,36);
  const data=ctx.getImageData(0,0,64,36).data;
  let luminance=0,bright=0,pixels=0;
  for(let i=0;i<data.length;i+=4){
    const y=.2126*data[i]+.7152*data[i+1]+.0722*data[i+2];
    luminance+=y;if(y>35)bright++;pixels++;
  }
  return {mean:luminance/Math.max(1,pixels),brightRatio:bright/Math.max(1,pixels),width,height};
});

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
    assert.equal(await film.getAttribute('data-visible-start'),'1.20','runtime must skip the nearly-black source opening');
    const initialMediaRequests=mediaRequests.length;
    assert.equal(initialMediaRequests,0,'Scroll World media must stay idle before the chapter reaches the viewport');

    const seekTo=async p=>{
      await film.evaluate((element,value)=>window.scrollTo({top:element.getBoundingClientRect().top+window.scrollY+(element.offsetHeight-innerHeight)*value,behavior:'instant'}),p);
      await page.waitForFunction(value=>{
        const el=document.querySelector('[data-movx-scroll-world="v117"]');
        const v=el?.querySelector('video');
        const t=Number(el?.dataset.worldTarget||0);
        return el?.dataset.mode==='scrub'&&el?.dataset.frameReady==='true'&&v?.currentSrc&&v.seekable.length>0&&Math.abs(v.currentTime-t)<.4&&Math.abs(Number(el.dataset.worldProgress)-value)<.03;
      },p,{timeout:18000}).catch(async error=>{
        const state=await film.evaluate(el=>({mode:el.dataset.mode,p:el.dataset.worldProgress,target:el.dataset.worldTarget,chapter:el.dataset.worldChapter,codec:el.dataset.mediaCodec,attempt:el.dataset.mediaAttempt,visibleStart:el.dataset.visibleStart,ready:el.dataset.frameReady,source:el.querySelector('video').currentSrc,time:el.querySelector('video').currentTime,seekable:el.querySelector('video').seekable.length,readyState:el.querySelector('video').readyState,error:el.querySelector('video').error?.message,canMp4:el.querySelector('video').canPlayType('video/mp4'),canWebM:el.querySelector('video').canPlayType('video/webm; codecs="vp9"')}));
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
    assert.ok(first>=1.1,`desktop scrub must skip the black opening: ${first}`);
    const firstFrame=await pixelMetric(film.locator('video'));
    assert.ok(firstFrame.mean>12&&firstFrame.brightRatio>.04,`desktop frame must contain visible image content, not black fallback: ${JSON.stringify(firstFrame)}`);
    assert.equal(await film.getAttribute('data-world-chapter'),'1');
    await page.screenshot({path:path.resolve('qa-v117-desktop.png')});

    await seekTo(.62);
    const middle=await film.locator('video').evaluate(v=>v.currentTime);
    const middleFrame=await pixelMetric(film.locator('video'));
    assert.ok(middleFrame.mean>12&&middleFrame.brightRatio>.04,`chapter 3 frame must remain visibly rendered: ${JSON.stringify(middleFrame)}`);
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
    await mobile.waitForFunction(()=>{const el=document.querySelector('[data-movx-scroll-world="v117"]');const v=el?.querySelector('video');return el?.dataset.frameReady==='true'&&v?.videoWidth>700&&v.videoWidth<1000},null,{timeout:18000}).catch(async error=>{
      const state=await mobileFilm.evaluate(el=>({width:innerWidth,match:matchMedia('(max-width: 767px)').matches,mode:el.dataset.mode,codec:el.dataset.mediaCodec,attempt:el.dataset.mediaAttempt,source:el.querySelector('video').currentSrc,videoWidth:el.querySelector('video').videoWidth,time:el.querySelector('video').currentTime,error:el.querySelector('video').error?.message}));
      throw new Error(`${error.message}\n${JSON.stringify(state)}`);
    });
    const mobileSource=await mobileFilm.locator('video').evaluate(v=>v.currentSrc);
    assert.ok(mobileSource.startsWith('blob:'),'mobile must keep the deferred Blob strategy');
    assert.equal(await mobileFilm.locator('video').evaluate(v=>getComputedStyle(v).objectFit),'contain');
    const mobileFrame=await pixelMetric(mobileFilm.locator('video'));
    assert.ok(mobileFrame.mean>10&&mobileFrame.brightRatio>.03,`mobile must render a visible video frame: ${JSON.stringify(mobileFrame)}`);
    await mobileFilm.evaluate(element=>window.scrollTo({top:element.getBoundingClientRect().top+window.scrollY+(element.offsetHeight-innerHeight)*.58,behavior:'instant'}));
    await mobile.waitForFunction(()=>{
      const el=document.querySelector('[data-movx-scroll-world="v117"]');
      return Number(el?.dataset.worldProgress)>.55&&el.dataset.frameReady==='true'&&el.querySelector('video').currentTime>3&&Number(el.dataset.worldChapter)>=3;
    });
    await mobile.screenshot({path:path.resolve('qa-v117-mobile.png')});
    await mobile.close();

    const reduced=await browser.newPage({viewport:{width:1440,height:900},reducedMotion:'reduce'});
    await reduced.goto('http://127.0.0.1:4173/',{waitUntil:'networkidle'});
    const reducedFilm=reduced.locator('[data-movx-scroll-world="v117"]');
    assert.equal(await reducedFilm.getAttribute('data-mode'),'fallback');
    assert.equal(await reducedFilm.locator('.movx-scroll-world__video').getAttribute('src'),null);
    assert.equal(await reducedFilm.locator('[data-world-chapter-panel]').count(),4,'reduced motion keeps the multi-section structure over the poster');
    await reducedFilm.scrollIntoViewIfNeeded();
    await reduced.waitForFunction(()=>document.querySelector('.movx-scroll-world__poster')?.naturalWidth>0,null,{timeout:10000});
    const posterFrame=await pixelMetric(reducedFilm.locator('.movx-scroll-world__poster'));
    assert.ok(posterFrame.mean>12&&posterFrame.brightRatio>.04,`fallback poster must be a visible source frame, not the black opening: ${JSON.stringify(posterFrame)}`);
    await reduced.screenshot({path:path.resolve('qa-v117-fallback-visible.png')});
    await reduced.close();
    console.log(JSON.stringify({status:'passed',initialMediaRequests,chapters:4,desktopCodec,desktopSource,visibleStart:1.20,firstFrame,middleFrame,mobileFrame,posterFrame,forward:[first,middle,last],reverse,mobileSource,reduced:'visible poster + chapters'}));
  }finally{await browser.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
