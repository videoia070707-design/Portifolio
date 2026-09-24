const {chromium}=require('playwright');
const assert=require('node:assert/strict');

(async()=>{
  const browser=await chromium.launch({headless:true});
  try{
    const page=await browser.newPage({viewport:{width:1440,height:900},deviceScaleFactor:1});
    await page.addInitScript(()=>localStorage.setItem('movx-theme','dark'));
    await page.goto('http://127.0.0.1:4173/',{waitUntil:'networkidle'});

    const world=page.locator('[data-movx-scroll-world="v117"]');
    assert.equal(await world.count(),1,'Scroll World must exist');
    assert.equal(await world.locator('[data-world-story]').count(),4,'Scroll World must expose four sparse editorial story beats');

    const blackTargets=['#livingArchive','#nicheIndex','#archiveControls','.projects-list','#about','#services','#process','#contact'];
    for(const selector of blackTargets){
      const el=page.locator(selector).first();
      if(!await el.count())continue;
      const bg=await el.evaluate(node=>getComputedStyle(node).backgroundColor);
      assert.equal(bg,'rgb(0, 0, 0)',`${selector} must be pure black in dark mode, got ${bg}`);
    }

    const seekTo=async p=>{
      await world.evaluate((element,value)=>window.scrollTo({top:element.getBoundingClientRect().top+window.scrollY+(element.offsetHeight-innerHeight)*value,behavior:'instant'}),p);
      await page.waitForFunction(value=>{
        const el=document.querySelector('[data-movx-scroll-world="v117"]');
        return Math.abs(Number(el?.dataset.worldProgress||0)-value)<.035&&Number(el?.dataset.storyOpacity||0)>.55;
      },p,{timeout:18000});
    };

    const assertStory=async(chapter,expectedTitle)=>{
      assert.equal(await world.getAttribute('data-story-chapter'),String(chapter),`story overlay must follow chapter ${chapter}`);
      const card=world.locator(`[data-world-story="${chapter}"]`);
      const state=await card.evaluate(el=>{
        const s=getComputedStyle(el);const r=el.getBoundingClientRect();
        return {opacity:Number(s.opacity),backgroundColor:s.backgroundColor,backgroundImage:s.backgroundImage,left:r.left,right:r.right,top:r.top,bottom:r.bottom,title:el.querySelector('.movx-scroll-world__story-title')?.textContent?.trim()||''};
      });
      assert.ok(state.opacity>.55,`chapter ${chapter} story must be visibly overlaid: ${state.opacity}`);
      assert.equal(state.backgroundColor,'rgba(0, 0, 0, 0)','story overlay must remain typography over video, not a card');
      assert.equal(state.backgroundImage,'none','story overlay must not create a panel/gradient card');
      assert.ok(state.left>=-2&&state.right<=1442&&state.top>=-2&&state.bottom<=902,`chapter ${chapter} story must stay inside viewport: ${JSON.stringify(state)}`);
      assert.equal(state.title,expectedTitle);
    };

    await seekTo(.32);
    await assertStory(2,'Sistema antes do template');
    await page.screenshot({path:'_site/qa-v129-story-ch2.png'});

    await seekTo(.62);
    await assertStory(3,'Ritmo cria profundidade');
    await page.screenshot({path:'_site/qa-v129-story-ch3.png'});

    await seekTo(.86);
    await assertStory(4,'Uma direção. Vários formatos.');
    await page.screenshot({path:'_site/qa-v129-story-ch4.png'});

    const mobile=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true});
    await mobile.addInitScript(()=>localStorage.setItem('movx-theme','dark'));
    await mobile.goto('http://127.0.0.1:4173/',{waitUntil:'networkidle'});
    const mobileWorld=mobile.locator('[data-movx-scroll-world="v117"]');
    await mobileWorld.evaluate(element=>window.scrollTo({top:element.getBoundingClientRect().top+window.scrollY+(element.offsetHeight-innerHeight)*.62,behavior:'instant'}));
    await mobile.waitForFunction(()=>{
      const el=document.querySelector('[data-movx-scroll-world="v117"]');
      return el?.dataset.storyChapter==='3'&&Number(el.dataset.storyOpacity||0)>.55;
    },null,{timeout:18000});
    const mobileCard=mobileWorld.locator('[data-world-story="3"]');
    const mobileBox=await mobileCard.boundingBox();
    assert.ok(mobileBox&&mobileBox.x>=0&&mobileBox.x+mobileBox.width<=391&&mobileBox.y>=0&&mobileBox.y+mobileBox.height<=845,`mobile story must stay in viewport: ${JSON.stringify(mobileBox)}`);
    await mobile.screenshot({path:'_site/qa-v129-story-mobile.png'});
    await mobile.close();

    console.log(JSON.stringify({status:'passed',stories:4,blackSections:blackTargets.length,desktopChapters:[2,3,4],mobileChapter:3,mode:'full-bleed video background + sparse scroll-linked editorial overlays'}));
  }finally{await browser.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
