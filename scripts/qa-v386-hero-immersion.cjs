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
      await page.waitForFunction(()=>document.documentElement.dataset.v386TallFraming==='v386-14-tall-viewport',null,{timeout:7000});
      await page.waitForFunction(()=>document.querySelector('[data-model-slot="boot-tv"]')?.dataset.glbState==='ready',null,{timeout:25000});
      await page.waitForFunction(()=>window.MOVX3D?.runtime?.instances?.['boot-tv']?.objectVolume?.state,null,{timeout:10000});
      await page.waitForTimeout(650);

      const state=await page.evaluate(async()=>{
        const THREE=await import('./vendor/three.module.js');
        const root=document.documentElement,boot=document.querySelector('#boot');
        const copy=boot.querySelector('.boot-copy'),wrap=boot.querySelector('.crt-wrap'),scene=boot.querySelector('.scene-inner');
        const title=boot.querySelector('.boot-title'),hint=boot.querySelector('.crt-object-hint');
        const sr=scene.getBoundingClientRect(),wr=wrap.getBoundingClientRect(),cr=copy.getBoundingClientRect();
        const inst=window.MOVX3D.runtime.instances['boot-tv'];
        inst.scene.updateMatrixWorld(true);inst.camera.updateMatrixWorld(true);

        /* A world-aligned Box3 around a rotated/deep CRT invents large corners that
           are not occupied by geometry and can report false clipping. Project the
           real GLB vertices after their complete world transforms instead. With
           only 44,831 triangles this is cheap enough for a release gate and gives
           the exact visible silhouette envelope we actually care about. */
        let minX=Infinity,maxX=-Infinity,minY=Infinity,maxY=-Infinity,vertices=0;
        const p=new THREE.Vector3();
        inst.model.traverse(node=>{
          if(!node.isMesh)return;
          const pos=node.geometry?.attributes?.position;if(!pos)return;
          for(let j=0;j<pos.count;j++){
            p.fromBufferAttribute(pos,j).applyMatrix4(node.matrixWorld).project(inst.camera);
            if(!Number.isFinite(p.x)||!Number.isFinite(p.y))continue;
            minX=Math.min(minX,p.x);maxX=Math.max(maxX,p.x);minY=Math.min(minY,p.y);maxY=Math.max(maxY,p.y);vertices++;
          }
        });
        const ndc={minX,maxX,minY,maxY,vertices};
        const canvasRect=inst.canvas.getBoundingClientRect();
        const projectedPixels={
          left:canvasRect.x+(minX+1)*canvasRect.width/2,
          right:canvasRect.x+(maxX+1)*canvasRect.width/2,
          top:canvasRect.y+(1-maxY)*canvasRect.height/2,
          bottom:canvasRect.y+(1-minY)*canvasRect.height/2,
        };
        return {
          marker:root.dataset.v386HeroImmersion,
          tallFraming:root.dataset.v386TallFraming,
          viewport:{w:innerWidth,h:innerHeight},
          scene:{x:sr.x,y:sr.y,w:sr.width,h:sr.height},wrap:{x:wr.x,y:wr.y,w:wr.width,h:wr.height},copy:{x:cr.x,y:cr.y,w:cr.width,h:cr.height},
          gap:cr.x-(wr.x+wr.width),titleMargin:parseFloat(getComputedStyle(title).marginBottom),cursor:getComputedStyle(wrap).cursor,
          hintDisplay:hint?getComputedStyle(hint).display:'none',yaw:inst.group.rotation.y,pitch:inst.group.rotation.x,depth:inst.group.position.z,
          ndc,projectedPixels,
          renderers:document.querySelectorAll('.v322-model-renderer').length,canvases:document.querySelectorAll('.v322-model-renderer canvas').length,
          activeSlots:window.MOVX3D.runtime.activeSlots,triangles:inst.stats.triangles,overflow:root.scrollWidth-innerWidth,
        };
      });

      assert.equal(state.marker,'v386-spatial-hero');assert.equal(state.tallFraming,'v386-14-tall-viewport');
      assert.equal(state.renderers,1);assert.equal(state.canvases,1);assert.deepEqual(state.activeSlots,['boot-tv']);assert.equal(state.triangles,44831);assert.ok(state.overflow<=2);
      assert.ok(state.ndc.vertices>1000,'real CRT projection sampled too few vertices');
      assert.ok(state.ndc.minX>-.985&&state.ndc.maxX<.985&&state.ndc.minY>-.985&&state.ndc.maxY<.985,`real CRT geometry is actually clipped inside its WebGL field: ${JSON.stringify(state.ndc)}`);

      if(cfg.name!=='mobile'){
        const sceneRight=state.scene.x+state.scene.w,sceneBottom=state.scene.y+state.scene.h;
        assert.ok(state.projectedPixels.left>=state.scene.x-4,`physical CRT silhouette escapes Scene 01 left edge: ${JSON.stringify(state.projectedPixels)}`);
        assert.ok(state.projectedPixels.right<=sceneRight+4,`physical CRT silhouette escapes Scene 01 right edge: ${JSON.stringify(state.projectedPixels)}`);
        assert.ok(state.projectedPixels.top>=state.scene.y-4,`physical CRT silhouette escapes Scene 01 top edge: ${JSON.stringify(state.projectedPixels)}`);
        assert.ok(state.projectedPixels.bottom<=sceneBottom+4,`physical CRT base/selector is visibly cut by Scene 01: ${JSON.stringify(state.projectedPixels)}`);
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
      console.log(JSON.stringify({qa:'v386-hero-immersion',viewport:cfg.name,status:'PASS',gap:state.gap,yaw:state.yaw,ndc:state.ndc,pixels:state.projectedPixels,titleMargin:state.titleMargin}));
      await page.close();
    }
  } finally {await browser.close()}
})().catch(err=>{console.error(err);process.exit(1)});
