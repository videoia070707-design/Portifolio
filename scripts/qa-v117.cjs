const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const path=require('node:path');

const pixelMetric=async locator=>locator.evaluate(media=>{
  const width=media.videoWidth||media.naturalWidth||0;
  const height=media.videoHeight||media.naturalHeight||0;
  if(!width||!height)return {mean:0,brightRatio:0,width,height,samples:[]};
  const canvas=document.createElement('canvas');
  canvas.width=32;canvas.height=18;
  const ctx=canvas.getContext('2d',{willReadFrequently:true});
  ctx.drawImage(media,0,0,32,18);
  const data=ctx.getImageData(0,0,32,18).data;
  let luminance=0,bright=0,pixels=0;
  const samples=[];
  for(let i=0;i<data.length;i+=4){
    const y=.2126*data[i]+.7152*data[i+1]+.0722*data[i+2];
    luminance+=y;if(y>35)bright++;pixels++;samples.push(Math.round(y));
  }
  return {mean:luminance/Math.max(1,pixels),brightRatio:bright/Math.max(1,pixels),width,height,samples};
});
const frameDelta=(a,b)=>{
  const n=Math.min(a.samples.length,b.samples.length);
  if(!n)return 0;
  let sum=0;
  for(let i=0;i<n;i++)sum+=Math.abs(a.samples[i]-b.samples[i]);
  return sum/n;
};
const publicMetric=metric=>({mean:metric.mean,brightRatio:metric.brightRatio,width:metric.width,height:metric.height});

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
    const video=film.locator('video');
    const poster=film.locator('.movx-scroll-world__poster');
    assert.equal(await film.count(),1);
    assert.equal(await film.locator('[data-world-chapter-panel]').count(),4,'Scroll World must expose four real scroll chapters');
    assert.equal(await film.locator('.movx-scroll-world__sticky').evaluate(el=>getComputedStyle(el).position),'sticky','film must remain a sticky background');
    assert.equal(await video.evaluate(v=>getComputedStyle(v).objectFit),'cover','desktop film must cover the viewport as a background');
    assert.equal(await video.getAttribute('src'),null,'Scroll World video must not compete with first paint');
    assert.equal(await film.getAttribute('data-source-trim'),'1.20','runtime must declare the source trim used by the encoded clip');
    assert.equal(mediaRequests.length,0,'Scroll World media must stay idle before real user scroll');

    const seekTo=async p=>{
      await film.evaluate((element,value)=>window.scrollTo({top:element.getBoundingClientRect().top+window.scrollY+(element.offsetHeight-innerHeight)*value,behavior:'instant'}),p);
      await page.waitForFunction(value=>{
        const el=document.querySelector('[data-movx-scroll-world="v117"]');
        const v=el?.querySelector('video');
        const poster=el?.querySelector('.movx-scroll-world__poster');
        const t=Number(el?.dataset.worldTarget||0);
        const videoOwnsFrame=v&&Number(getComputedStyle(v).opacity)>.95;
        const posterReleased=poster&&getComputedStyle(poster).visibility==='hidden'&&Number(getComputedStyle(poster).opacity)<.05;
        return el?.dataset.mode==='scrub'&&el?.dataset.scrubLive==='true'&&el?.dataset.frameReady==='true'&&v?.currentSrc&&v.seekable.length>0&&Math.abs(v.currentTime-t)<.35&&Math.abs(Number(el.dataset.worldProgress)-value)<.03&&videoOwnsFrame&&posterReleased;
      },p,{timeout:18000}).catch(async error=>{
        const state=await film.evaluate(el=>({mode:el.dataset.mode,p:el.dataset.worldProgress,target:el.dataset.worldTarget,chapter:el.dataset.worldChapter,codec:el.dataset.mediaCodec,attempt:el.dataset.mediaAttempt,trim:el.dataset.sourceTrim,nearby:el.dataset.nearby,ready:el.dataset.frameReady,live:el.dataset.scrubLive,source:el.querySelector('video').currentSrc,time:el.querySelector('video').currentTime,seekable:el.querySelector('video').seekable.length,readyState:el.querySelector('video').readyState,videoOpacity:getComputedStyle(el.querySelector('video')).opacity,posterOpacity:getComputedStyle(el.querySelector('.movx-scroll-world__poster')).opacity,posterVisibility:getComputedStyle(el.querySelector('.movx-scroll-world__poster')).visibility,error:el.querySelector('video').error?.message}));
        throw new Error(`${error.message}\n${JSON.stringify(state)}`);
      });
    };

    await seekTo(.10);
    const desktopSource=await video.evaluate(v=>v.currentSrc);
    const desktopCodec=await film.getAttribute('data-media-codec');
    assert.ok(desktopSource.startsWith('blob:'),'desktop must use the deferred Blob source for reliable scrub seeking');
    assert.match(desktopCodec||'',/^(h264-mp4|vp9-webm)$/,'desktop must settle on a supported optimized codec');
    assert.ok(mediaRequests.some(url=>/movx-scroll-world-0923\.mp4/.test(url)),'desktop must attempt the H.264 source first when MP4 is advertised');
    if(desktopCodec==='vp9-webm'){
      assert.ok(mediaRequests.some(url=>/movx-scroll-world-0923\.webm/.test(url)),'desktop must fetch the VP9 fallback if H.264 cannot decode');
    }
    const first=await video.evaluate(v=>v.currentTime);
    const firstFrame=await pixelMetric(video);
    assert.ok(firstFrame.mean>12&&firstFrame.brightRatio>.04,`desktop frame must contain visible video content: ${JSON.stringify(publicMetric(firstFrame))}`);
    assert.ok(Number(await video.evaluate(el=>getComputedStyle(el).opacity))>.95,'real video layer must own the rendered image');
    assert.ok(Number(await poster.evaluate(el=>getComputedStyle(el).opacity))<.05,'poster must disappear once a real decoded frame exists');
    assert.equal(await poster.evaluate(el=>getComputedStyle(el).visibility),'hidden','poster must not remain visually stacked over the live scrub');
    await page.screenshot({path:path.resolve('qa-v117-desktop.png')});

    await seekTo(.62);
    const middle=await video.evaluate(v=>v.currentTime);
    const middleFrame=await pixelMetric(video);
    const desktopDelta=frameDelta(firstFrame,middleFrame);
    assert.ok(middleFrame.mean>12&&middleFrame.brightRatio>.04,`chapter 3 frame must remain visibly rendered: ${JSON.stringify(publicMetric(middleFrame))}`);
    assert.ok(desktopDelta>7,`real scroll must visibly change video pixels instead of leaving a fixed PNG: delta=${desktopDelta}`);
    assert.ok(middle>first+2,`scroll must advance actual clip time: ${first} -> ${middle}`);
    assert.equal(await film.getAttribute('data-world-chapter'),'3','chapter counter must follow scroll progress');
    await page.screenshot({path:path.resolve('qa-v117-chapter-3.png')});

    await seekTo(.86);
    const last=await video.evaluate(v=>v.currentTime);
    const lastFrame=await pixelMetric(video);
    const laterDelta=frameDelta(middleFrame,lastFrame);
    assert.ok(laterDelta>5,`later scroll must keep changing rendered pixels: delta=${laterDelta}`);
    assert.ok(last>middle+1,`later section must keep advancing the clip: ${middle} -> ${last}`);
    assert.equal(await film.getAttribute('data-world-chapter'),'4');
    await page.screenshot({path:path.resolve('qa-v117-archive.png')});

    await seekTo(.30);
    const reverse=await video.evaluate(v=>v.currentTime);
    const reverseFrame=await pixelMetric(video);
    assert.ok(reverse<last-2,'reverse scroll must rewind the real film');
    assert.ok(frameDelta(lastFrame,reverseFrame)>5,'reverse scroll must also change displayed pixels');
    assert.equal(await film.getAttribute('data-world-chapter'),'2');
    assert.deepEqual(errors,[],'page errors');
    await page.close();

    const mobilePage=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true});
    await mobilePage.goto('http://127.0.0.1:4173/',{waitUntil:'networkidle'});
    const mobileFilm=mobilePage.locator('[data-movx-scroll-world="v117"]');
    const mobileVideo=mobileFilm.locator('video');
    assert.equal(await mobileVideo.getAttribute('src'),null,'mobile video must stay idle on first paint');
    await mobileFilm.scrollIntoViewIfNeeded();
    await mobilePage.waitForFunction(()=>{const el=document.querySelector('[data-movx-scroll-world="v117"]');const v=el?.querySelector('video');return el?.dataset.scrubLive==='true'&&v?.videoWidth>700&&v.videoWidth<1000},null,{timeout:18000});
    const mobileCodec=await mobileFilm.getAttribute('data-media-codec');
    assert.match(mobileCodec||'',/^(h264-mp4|vp9-webm)$/,'mobile must settle on a supported optimized codec');
    assert.equal(await mobileVideo.evaluate(v=>getComputedStyle(v).objectFit),'cover','mobile film must also own the full section background');
    const mobileStart=await pixelMetric(mobileVideo);
    await mobileFilm.evaluate(element=>window.scrollTo({top:element.getBoundingClientRect().top+window.scrollY+(element.offsetHeight-innerHeight)*.58,behavior:'instant'}));
    await mobilePage.waitForFunction(()=>{const el=document.querySelector('[data-movx-scroll-world="v117"]');return Number(el?.dataset.worldProgress)>.55&&el.dataset.scrubLive==='true'&&Number(el.dataset.worldChapter)>=3});
    const mobileMiddle=await pixelMetric(mobileVideo);
    const mobileDelta=frameDelta(mobileStart,mobileMiddle);
    assert.ok(mobileStart.mean>10&&mobileMiddle.mean>10,`mobile frames must stay visible`);
    assert.ok(mobileDelta>5,`mobile scroll must visibly change the film: delta=${mobileDelta}`);
    await mobilePage.screenshot({path:path.resolve('qa-v117-mobile.png')});
    const mobileSource=await mobileVideo.evaluate(v=>v.currentSrc);
    await mobilePage.close();

    const reducedPage=await browser.newPage({viewport:{width:1440,height:900},reducedMotion:'reduce'});
    await reducedPage.goto('http://127.0.0.1:4173/',{waitUntil:'networkidle'});
    const reducedFilm=reducedPage.locator('[data-movx-scroll-world="v117"]');
    const reducedVideo=reducedFilm.locator('video');
    assert.equal(await reducedFilm.getAttribute('data-motion-preference'),'system-reduce-scroll-controlled','system reduced-motion preference must stay scroll-controlled rather than static');
    assert.equal(await reducedVideo.getAttribute('src'),null,'reduced-motion path must still avoid loading before user scroll');
    const reducedSeek=async p=>{
      await reducedFilm.evaluate((element,value)=>window.scrollTo({top:element.getBoundingClientRect().top+window.scrollY+(element.offsetHeight-innerHeight)*value,behavior:'instant'}),p);
      await reducedPage.waitForFunction(value=>{
        const el=document.querySelector('[data-movx-scroll-world="v117"]');
        const v=el?.querySelector('video');
        return el?.dataset.mode==='scrub'&&el?.dataset.scrubLive==='true'&&el?.dataset.frameReady==='true'&&v?.currentSrc&&Math.abs(Number(el.dataset.worldProgress)-value)<.035;
      },p,{timeout:18000});
    };
    await reducedSeek(.18);
    const reducedStartTime=await reducedVideo.evaluate(v=>v.currentTime);
    const reducedStartFrame=await pixelMetric(reducedVideo);
    const reducedStartDepth=Number(await reducedFilm.getAttribute('data-world-depth'));
    await reducedSeek(.66);
    const reducedEndTime=await reducedVideo.evaluate(v=>v.currentTime);
    const reducedEndFrame=await pixelMetric(reducedVideo);
    const reducedEndDepth=Number(await reducedFilm.getAttribute('data-world-depth'));
    const reducedDelta=frameDelta(reducedStartFrame,reducedEndFrame);
    assert.ok(reducedEndTime>reducedStartTime+2,`reduced-motion preference must not freeze film time: ${reducedStartTime} -> ${reducedEndTime}`);
    assert.ok(reducedDelta>5,`reduced-motion preference must not turn Scroll World into a PNG: delta=${reducedDelta}`);
    assert.ok(Math.abs(reducedEndDepth-reducedStartDepth)>80,`reduced-motion preference must keep scroll-linked depth: ${reducedStartDepth} -> ${reducedEndDepth}`);
    await reducedPage.screenshot({path:'_site/qa-v124-reduced-scroll-controlled.png'});
    await reducedPage.close();

    console.log(JSON.stringify({status:'passed',initialMediaRequests:0,chapters:4,desktopCodec,mobileCodec,desktopSource,sourceTrim:1.20,desktopDelta,laterDelta,mobileDelta,reducedDelta,firstFrame:publicMetric(firstFrame),middleFrame:publicMetric(middleFrame),forward:[first,middle,last],reverse,mobileSource,reduced:'scroll-controlled full-bleed video retained; poster only for decode/network failure'}));
  }finally{await browser.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
