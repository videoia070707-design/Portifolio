const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');

(async()=>{
  const models=fs.readdirSync('_site/models').filter(x=>x.endsWith('.glb')).sort();
  assert.deepEqual(models,['movx-crt-tv.glb']);
  const browser=await chromium.launch({headless:true,args:['--no-sandbox','--use-angle=swiftshader','--enable-webgl','--ignore-gpu-blocklist']});
  try{
    for(const cfg of [
      {name:'desktop',viewport:{width:1440,height:1000}},
      {name:'short',viewport:{width:1366,height:768}},
      {name:'mobile',viewport:{width:390,height:844},isMobile:true,hasTouch:true},
    ]){
      const page=await browser.newPage(cfg),errors=[];
      page.on('pageerror',e=>errors.push(String(e)));
      await page.goto(process.env.MOVX_TEST_URL||'http://127.0.0.1:4173/',{waitUntil:'domcontentloaded',timeout:30000});
      await page.waitForFunction(()=>document.documentElement.dataset.v385HeroOnly==='v385-hero-recovery',null,{timeout:6000});
      await page.waitForFunction(()=>document.querySelector('[data-model-slot="boot-tv"]')?.dataset.glbState==='ready',null,{timeout:25000});
      await page.waitForFunction(()=>window.MOVX3D?.runtime?.instances?.['boot-tv']?.stats?.triangles===44831,null,{timeout:8000});

      const state=await page.evaluate(()=>{
        const root=document.documentElement,boot=document.querySelector('#boot');
        const stage=boot.querySelector('.boot-stage'),copy=boot.querySelector('.boot-copy'),title=boot.querySelector('.boot-title'),wrap=boot.querySelector('.crt-wrap');
        const panel=boot.querySelector('.crt-channel-panel'),tags=boot.querySelector('.boot-tags');
        const sr=stage.getBoundingClientRect(),cr=copy.getBoundingClientRect(),wr=wrap.getBoundingClientRect(),pr=panel.getBoundingClientRect();
        const scene=boot.querySelector('.scene-inner').getBoundingClientRect();
        const ts=getComputedStyle(title),stageStyle=getComputedStyle(stage),third=title.querySelector('span:nth-child(3)');
        const inst=window.MOVX3D.runtime.instances['boot-tv'];
        return {
          marker:root.dataset.v385HeroOnly,
          retired:[root.dataset.v381ArtDirection,root.dataset.v382ReferenceSynthesis,root.dataset.v383Deplaceholder,root.dataset.v384CompositionPolish].filter(Boolean),
          grid:stageStyle.gridTemplateColumns,
          stage:{x:sr.x,y:sr.y,w:sr.width,h:sr.height},copy:{x:cr.x,y:cr.y,w:cr.width,h:cr.height},wrap:{x:wr.x,y:wr.y,w:wr.width,h:wr.height},panel:{x:pr.x,y:pr.y,w:pr.width,h:pr.height},scene:{x:scene.x,y:scene.y,w:scene.width,h:scene.height},
          title:{font:parseFloat(ts.fontSize),line:parseFloat(ts.lineHeight),marginBottom:parseFloat(ts.marginBottom),thirdColor:getComputedStyle(third).color},
          tagsDisplay:getComputedStyle(tags).display,
          sceneRadius:getComputedStyle(boot.querySelector('.scene-inner')).borderRadius,
          sceneBackground:getComputedStyle(boot.querySelector('.scene-inner')).backgroundImage,
          canvases:document.querySelectorAll('.v322-model-renderer canvas').length,
          renderers:document.querySelectorAll('.v322-model-renderer').length,
          activeSlots:window.MOVX3D.runtime.activeSlots,
          deferred:window.MOVX3D.runtime.deferredSlots,
          triangles:inst.stats.triangles,
          overflow:root.scrollWidth-innerWidth,
        };
      });

      assert.equal(state.marker,'v385-hero-recovery');
      assert.deepEqual(state.retired,[],'global v381-v384 visual layers must not be installed');
      assert.equal(state.canvases,1);assert.equal(state.renderers,1);assert.deepEqual(state.activeSlots,['boot-tv']);assert.equal(state.triangles,44831);
      assert.ok(state.deferred.includes('hero-movx-logo')&&state.deferred.includes('x-portal'));
      assert.ok(state.overflow<=2,'horizontal overflow regression');
      assert.equal(state.sceneRadius,'0px','Hero returned to a card/frame');
      assert.ok(/gradient/i.test(state.sceneBackground),'Hero lacks authored environment field');

      if(cfg.name!=='mobile'){
        assert.ok(state.copy.x>innerWidth*0.53,'editorial rail is not materially right-weighted');
        assert.ok(state.wrap.w>innerWidth*.40,'CRT spatial field is still too small');
        assert.ok(state.copy.w<=530,'copy rail became a wide generic column');
        assert.ok(state.title.font>=46,'Hero title lacks opening-scale impact');
        assert.ok(state.title.marginBottom>=23,'Hero title/copy rhythm is still cramped');
        assert.ok(state.panel.h<220,'channel detail deck is too tall/card-like');
        assert.equal(state.tagsDisplay,'grid');
      }else{
        assert.ok(state.copy.y>state.wrap.y+state.wrap.h*.70,'mobile copy starts through the CRT physical footprint');
        assert.ok(state.title.font>=46,'mobile Hero title is under-scaled');
      }
      assert.deepEqual(errors,[],'page errors: '+errors.join(' | '));
      await page.locator('#boot').screenshot({path:`_site/qa-v385-hero-${cfg.name}.png`});
      fs.writeFileSync(`_site/qa-v385-hero-${cfg.name}.json`,JSON.stringify(state,null,2));
      console.log(JSON.stringify({qa:'v385-hero-only',viewport:cfg.name,status:'PASS',copyX:state.copy.x,crtW:state.wrap.w,title:state.title,panelH:state.panel.h}));
      await page.close();
    }
  } finally {await browser.close()}
})().catch(err=>{console.error(err);process.exit(1)});
