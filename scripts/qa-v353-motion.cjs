const {chromium}=require('playwright');
const assert=require('node:assert/strict');

(async()=>{
  const browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-webgl','--ignore-gpu-blocklist']});
  try{
    for(const cfg of [
      {name:'desktop',viewport:{width:1440,height:1000}},
      {name:'mobile',viewport:{width:390,height:844}},
    ]){
      const page=await browser.newPage({viewport:cfg.viewport,deviceScaleFactor:1});
      const pageErrors=[];page.on('pageerror',e=>pageErrors.push(String(e)));
      await page.goto('http://127.0.0.1:4173/',{waitUntil:'domcontentloaded',timeout:30000});
      await page.waitForFunction(()=>document.documentElement.dataset.motionReady==='true',null,{timeout:15000});
      await page.waitForFunction(()=>document.querySelector('[data-model-slot="boot-tv"]')?.dataset.glbState==='ready',null,{timeout:30000});
      await page.waitForFunction(()=>document.documentElement.dataset.motionIntro==='ready',null,{timeout:10000});
      const hasV354=await page.evaluate(()=>!!document.querySelector('[data-v354-boot-choreo-runtime]'));
      if(hasV354)await page.waitForFunction(()=>document.documentElement.dataset.motionChoreoReady==='true',null,{timeout:10000});
      const state=await page.evaluate(()=>{
        const root=document.documentElement;
        const title=document.querySelector('.boot-title');
        const crt=document.querySelector('[data-model-slot="boot-tv"]');
        const wrap=document.querySelector('.crt-wrap');
        return {
          motion:root.dataset.motion,
          ready:root.dataset.motionReady,
          reduced:root.dataset.motionReduced,
          layer:root.dataset.motionLayer,
          choreography:root.dataset.motionChoreo||null,
          crtAsset:root.dataset.crtAsset,
          crtKind:crt?.dataset.modelKind,
          headline:title?[...title.querySelectorAll('span')].map(x=>x.textContent.trim()).join(' '):'',
          oldHeadline:document.body.textContent.includes('O SITE ACORDA COM VOCÊ'),
          tags:[...document.querySelectorAll('.boot-tags .tag')].map(x=>x.textContent.trim()),
          wrapTransform:getComputedStyle(wrap).transform,
          renderers:document.querySelectorAll('.v322-model-renderer').length,
          overflow:root.scrollWidth-root.clientWidth,
          errors:window.MOVX3D?.runtime?.errors||[],
        };
      });
      assert.equal(state.motion,'v353-cinematic');
      assert.equal(state.ready,'true');
      assert.equal(state.layer,'v353-cinematic-motion');
      assert.equal(state.crtAsset,'v352-standalone-vintage-computer');
      assert.equal(state.crtKind,'glb');
      assert.equal(state.headline,'IDEIAS NÃO FICAM PARADAS');
      assert.equal(state.oldHeadline,false);
      assert.deepEqual(state.tags,['DIREÇÃO','MOTION','AI','DIGITAL']);
      assert.equal(state.renderers,1,'v353 must not activate later 3D models');
      assert.equal(state.errors.length,0,'runtime errors: '+JSON.stringify(state.errors));
      assert.ok(state.overflow<=2,'horizontal overflow regression');

      if(cfg.name==='desktop'){
        if(state.choreography==='v354-boot-scroll'){
          await page.evaluate(()=>{
            document.documentElement.style.scrollBehavior='auto';
            const boot=document.querySelector('#boot');
            const travel=Math.max(1,boot.offsetHeight-innerHeight);
            scrollTo(0,boot.offsetTop+travel*.32);
          });
          await page.waitForFunction(()=>parseFloat(document.documentElement.dataset.motionChoreoProgress||'0')>.12,null,{timeout:5000});
          const progress=await page.evaluate(()=>parseFloat(document.documentElement.dataset.motionChoreoProgress||'0'));
          assert.ok(progress>.12,'v354 choreography did not take over Scene-01 motion');
        }else{
          const before=state.wrapTransform;
          await page.mouse.move(1250,760);
          await page.evaluate(()=>scrollTo(0,Math.min(220,document.body.scrollHeight-innerHeight)));
          await page.waitForTimeout(500);
          const after=await page.$eval('.crt-wrap',el=>getComputedStyle(el).transform);
          assert.notEqual(after,before,'CRT wrapper did not respond to pointer/scroll motion');
        }
        await page.evaluate(()=>{
          document.documentElement.style.scrollBehavior='auto';
          const hero=document.querySelector('#hero');
          if(hero)window.scrollTo(0,hero.offsetTop+Math.max(0,(hero.offsetHeight-innerHeight)/2));
        });
        await page.waitForFunction(()=>document.querySelector('#hero')?.dataset.motionVisible==='true',null,{timeout:5000});
        const heroVisible=await page.$eval('#hero',el=>el.dataset.motionVisible);
        assert.equal(heroVisible,'true','next scene did not receive motion reveal state');
      }
      assert.equal(pageErrors.length,0,'page errors: '+pageErrors.join(' | '));
      await page.evaluate(()=>{document.documentElement.style.scrollBehavior='auto';scrollTo(0,0)});
      await page.waitForTimeout(200);
      await page.screenshot({path:`_site/qa-v353-motion-${cfg.name}.png`,fullPage:false});
      console.log(JSON.stringify({qa:'v353-motion',viewport:cfg.name,status:'PASS',state}));
      await page.close();
    }

    const reducedPage=await browser.newPage({viewport:{width:1280,height:800},reducedMotion:'reduce'});
    await reducedPage.goto('http://127.0.0.1:4173/',{waitUntil:'domcontentloaded',timeout:30000});
    await reducedPage.waitForFunction(()=>document.documentElement.dataset.motionReady==='true',null,{timeout:10000});
    const reducedState=await reducedPage.evaluate(()=>({
      reduced:document.documentElement.dataset.motionReduced,
      title:getComputedStyle(document.querySelector('.boot-title')).opacity,
      rendererCount:document.querySelectorAll('.v322-model-renderer').length,
    }));
    assert.equal(reducedState.reduced,'true','reduced-motion preference was not respected');
    assert.equal(reducedState.title,'1');
    await reducedPage.close();
  } finally {await browser.close()}
})().catch(err=>{console.error(err);process.exit(1)});
