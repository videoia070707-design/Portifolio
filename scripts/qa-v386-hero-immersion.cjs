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
      await page.waitForFunction(()=>document.documentElement.dataset.v386HeroImmersion==='v386-spatial-hero',null,{timeout:7000});
      await page.waitForFunction(()=>document.querySelector('[data-model-slot="boot-tv"]')?.dataset.glbState==='ready',null,{timeout:25000});
      await page.waitForFunction(()=>window.MOVX3D?.runtime?.instances?.['boot-tv']?.objectVolume?.state,null,{timeout:10000});
      await page.waitForTimeout(650);

      const state=await page.evaluate(async()=>{
        const THREE=await import('./vendor/three.module.js');
        const root=document.documentElement,boot=document.querySelector('#boot');
        const stage=boot.querySelector('.boot-stage'),copy=boot.querySelector('.boot-copy'),wrap=boot.querySelector('.crt-wrap'),scene=boot.querySelector('.scene-inner');
        const title=boot.querySelector('.boot-title'),hint=boot.querySelector('.crt-object-hint');
        const sr=scene.getBoundingClientRect(),wr=wrap.getBoundingClientRect(),cr=copy.getBoundingClientRect();
        const inst=window.MOVX3D.runtime.instances['boot-tv'];
        inst.scene.updateMatrixWorld(true);inst.camera.updateMatrixWorld(true);
        const box=new THREE.Box3().setFromObject(inst.model);
        const pts=[];
        for(const x of [box.min.x,box.max.x])for(const y of [box.min.y,box.max.y])for(const z of [box.min.z,box.max.z]){
          const p=new THREE.Vector3(x,y,z).project(inst.camera);pts.push({x:p.x,y:p.y,z:p.z});
        }
        const ndc={minX:Math.min(...pts.map(p=>p.x)),maxX:Math.max(...pts.map(p=>p.x)),minY:Math.min(...pts.map(p=>p.y)),maxY:Math.max(...pts.map(p=>p.y))};
        return {
          marker:root.dataset.v386HeroImmersion,
          viewport:{w:innerWidth,h:innerHeight},
          scene:{x:sr.x,y:sr.y,w:sr.width,h:sr.height},wrap:{x:wr.x,y:wr.y,w:wr.width,h:wr.height},copy:{x:cr.x,y:cr.y,w:cr.width,h:cr.height},
          gap:cr.x-(wr.x+wr.width),
          titleMargin:parseFloat(getComputedStyle(title).marginBottom),
          cursor:getComputedStyle(wrap).cursor,
          hintDisplay:hint?getComputedStyle(hint).display:'none',
          yaw:inst.group.rotation.y,pitch:inst.group.rotation.x,depth:inst.group.position.z,
          ndc,
          renderers:document.querySelectorAll('.v322-model-renderer').length,
          canvases:document.querySelectorAll('.v322-model-renderer canvas').length,
          activeSlots:window.MOVX3D.runtime.activeSlots,
          triangles:inst.stats.triangles,
          overflow:root.scrollWidth-innerWidth,
        };
      });

      assert.equal(state.marker,'v386-spatial-hero');assert.equal(state.renderers,1);assert.equal(state.canvases,1);assert.deepEqual(state.activeSlots,['boot-tv']);assert.equal(state.triangles,44831);assert.ok(state.overflow<=2);
      assert.ok(state.ndc.minX>-1.08&&state.ndc.maxX<1.08&&state.ndc.minY>-1.08&&state.ndc.maxY<1.08,`real CRT projection is clipped: ${JSON.stringify(state.ndc)}`);

      if(cfg.name!=='mobile'){
        assert.ok(state.wrap.x>=0&&state.wrap.x+state.wrap.w<=state.viewport.w+1,'CRT interaction field escapes viewport');
        assert.ok(state.copy.x>state.viewport.w*.55,'copy rail is not clearly separated from CRT field');
        assert.ok(state.gap>24,`CRT/copy gap is too cramped: ${state.gap}`);
        assert.ok(state.titleMargin>=28,'title/copy rhythm is still cramped');
        assert.equal(state.cursor,'grab','desktop CRT does not advertise direct physical manipulation');
        assert.ok(Math.abs(state.yaw)>.16,`resting CRT still reads too front-flat: yaw=${state.yaw}`);
      }else{
        assert.ok(state.copy.y>state.wrap.y+state.wrap.h*.55,'mobile editorial content starts through the CRT field');
      }
      assert.deepEqual(errors,[],'page errors: '+errors.join(' | '));
      await page.locator('#boot').screenshot({path:`_site/qa-v386-hero-${cfg.name}.png`});
      fs.writeFileSync(`_site/qa-v386-hero-${cfg.name}.json`,JSON.stringify(state,null,2));
      console.log(JSON.stringify({qa:'v386-hero-immersion',viewport:cfg.name,status:'PASS',gap:state.gap,yaw:state.yaw,ndc:state.ndc,titleMargin:state.titleMargin}));
      await page.close();
    }
  } finally {await browser.close()}
})().catch(err=>{console.error(err);process.exit(1)});
