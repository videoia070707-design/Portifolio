const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');

(async()=>{
  const models=fs.readdirSync('_site/models').filter(x=>x.toLowerCase().endsWith('.glb')).sort();
  assert.deepEqual(models,['movx-crt-tv.glb'],'v379 must keep exactly one production GLB');
  const browser=await chromium.launch({headless:true,args:['--no-sandbox','--use-angle=swiftshader','--enable-webgl','--ignore-gpu-blocklist']});
  try{
    const inspect=async(page)=>page.evaluate(async()=>{
      const THREE=await import('./vendor/three.module.js');
      const root=document.documentElement,boot=document.querySelector('#boot');
      const stage=boot.querySelector('.boot-stage'),copy=boot.querySelector('.boot-copy'),title=boot.querySelector('.boot-title');
      const lines=[...title.querySelectorAll('span')],paragraph=copy.querySelector('.copy'),tags=boot.querySelector('.boot-tags'),panel=boot.querySelector('#crt-channel-panel');
      const scene=boot.querySelector('.scene-inner').getBoundingClientRect();
      const sr=stage.getBoundingClientRect(),cr=copy.getBoundingClientRect(),tr=title.getBoundingClientRect(),pr=paragraph.getBoundingClientRect(),tar=tags.getBoundingClientRect(),par=panel.getBoundingClientRect();
      const lr=lines.map(el=>{const r=el.getBoundingClientRect();return {top:r.top,bottom:r.bottom,height:r.height,left:r.left,right:r.right}});
      const lineGaps=lr.slice(1).map((r,i)=>r.top-lr[i].bottom);
      const inst=window.MOVX3D.runtime.instances['boot-tv'];
      inst.scene.updateMatrixWorld(true);inst.camera.updateMatrixWorld(true);
      const canvas=inst.canvas.getBoundingClientRect(),box=new THREE.Box3().setFromObject(inst.model),pts=[];
      for(const x of [box.min.x,box.max.x])for(const y of [box.min.y,box.max.y])for(const z of [box.min.z,box.max.z]){
        const p=new THREE.Vector3(x,y,z).project(inst.camera);pts.push({x:canvas.x+(p.x+1)*canvas.width/2,y:canvas.y+(1-p.y)*canvas.height/2});
      }
      const model={left:Math.min(...pts.map(p=>p.x)),right:Math.max(...pts.map(p=>p.x)),top:Math.min(...pts.map(p=>p.y)),bottom:Math.max(...pts.map(p=>p.y))};
      const visibleWidth=Math.max(0,Math.min(model.right,scene.right)-Math.max(model.left,scene.left));
      const projectedWidth=Math.max(1,model.right-model.left);
      return {
        layer:root.dataset.crtEditorialGridLayer,
        inline:!!document.querySelector('style[data-v379-editorial-grid="v379-editorial-safe-zones"]'),
        viewport:{w:innerWidth,h:innerHeight},scene:{left:scene.left,right:scene.right,top:scene.top,bottom:scene.bottom},stage:{left:sr.left,right:sr.right,top:sr.top,bottom:sr.bottom},
        copy:{left:cr.left,right:cr.right,top:cr.top,bottom:cr.bottom,width:cr.width},title:{top:tr.top,bottom:tr.bottom,width:tr.width},
        paragraph:{top:pr.top,bottom:pr.bottom,width:pr.width},tags:{top:tar.top,bottom:tar.bottom,width:tar.width},panel:{top:par.top,bottom:par.bottom,width:par.width},
        lineGaps,model,modelCopyGap:cr.left-model.right,
        verticalContained:model.top>=scene.top-8&&model.bottom<=scene.bottom+8,
        horizontalVisibleRatio:visibleWidth/projectedWidth,
        panelInside:par.bottom<=scene.bottom+1,
        copyInside:cr.top>=scene.top-1&&cr.bottom<=scene.bottom+1&&cr.left>=scene.left-1&&cr.right<=scene.right+1,
        titleToCopy:pr.top-tr.bottom,copyToTags:tar.top-pr.bottom,
        progress:Number(window.MOVXCRT?.progress ?? getComputedStyle(root).getPropertyValue('--crt-progress') ?? 0),scrollY,
        renderers:document.querySelectorAll('.v322-model-renderer').length,activeSlots:window.MOVX3D.runtime.activeSlots,
        triangles:inst.stats.triangles,overflow:root.scrollWidth-innerWidth,errors:window.MOVX3D.runtime.errors,
      };
    });

    for(const cfg of [
      {name:'desktop',viewport:{width:1440,height:1000},mid:true},
      {name:'short-1366',viewport:{width:1366,height:768},mid:true},
      {name:'short-1280',viewport:{width:1280,height:720},mid:true},
    ]){
      const page=await browser.newPage({viewport:cfg.viewport,deviceScaleFactor:1});const errors=[];
      page.on('pageerror',e=>errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
      await page.goto('http://127.0.0.1:4173/',{waitUntil:'domcontentloaded',timeout:30000});
      await page.waitForFunction(()=>document.querySelector('[data-model-slot="boot-tv"]')?.dataset.glbState==='ready',null,{timeout:25000});
      await page.waitForFunction(()=>document.documentElement.dataset.motionIntro==='ready',null,{timeout:12000});
      await page.waitForTimeout(420);
      const s=await inspect(page);
      assert.equal(s.layer,'v379-editorial-safe-zones');assert.equal(s.inline,true);
      assert.equal(s.renderers,1);assert.deepEqual(s.activeSlots,['boot-tv']);assert.equal(s.triangles,44831);assert.ok(s.overflow<=2);assert.equal(s.errors.length,0);
      assert.ok(s.copy.width>=380&&s.copy.width<=510,`${cfg.name} copy column is not bounded editorially: ${s.copy.width}`);
      assert.ok(s.lineGaps.every(g=>g>=2),`${cfg.name} title lines are still visually collapsed: ${JSON.stringify(s.lineGaps)}`);
      assert.ok(s.titleToCopy>=18,`${cfg.name} headline/copy rhythm is too tight: ${s.titleToCopy}`);
      assert.ok(s.copyToTags>=15,`${cfg.name} copy/channel rhythm is too tight: ${s.copyToTags}`);
      assert.equal(s.panelInside,true,`${cfg.name} channel panel escaped Scene 01`);assert.equal(s.copyInside,true,`${cfg.name} editorial column escaped Scene 01`);
      assert.ok(s.modelCopyGap>=22,`${cfg.name} CRT/copy safe zone collapsed: ${s.modelCopyGap}`);
      assert.equal(s.verticalContained,true,`${cfg.name} real CRT is vertically clipped at first paint: ${JSON.stringify(s.model)}`);
      assert.ok(s.horizontalVisibleRatio>=.82,`${cfg.name} real CRT is materially cropped at first paint: ${s.horizontalVisibleRatio}`);

      let mid=null;
      if(cfg.mid){
        await page.evaluate(()=>{
          document.documentElement.style.scrollBehavior='auto';document.body.style.scrollBehavior='auto';
          const boot=document.querySelector('#boot'),travel=Math.max(1,boot.offsetHeight-innerHeight);
          scrollTo({top:Math.round(boot.offsetTop+travel*.48),left:0,behavior:'instant'});
        });
        await page.waitForTimeout(900);
        mid=await inspect(page);
        assert.ok(mid.progress>.30,`${cfg.name} did not enter Scene-01 choreography: ${mid.progress}`);
        assert.equal(mid.verticalContained,true,`${cfg.name} CRT is clipped during mid-scroll choreography: ${JSON.stringify({model:mid.model,scene:mid.scene,progress:mid.progress})}`);
        assert.ok(mid.horizontalVisibleRatio>=.82,`${cfg.name} CRT loses too much horizontal volume at mid-scroll: ${mid.horizontalVisibleRatio}`);
        assert.ok(mid.modelCopyGap>=18,`${cfg.name} CRT/copy moat collapsed during mid-scroll: ${mid.modelCopyGap}`);
        assert.equal(mid.copyInside,true,`${cfg.name} copy escaped Scene 01 during mid-scroll`);
        assert.ok(mid.overflow<=2,`${cfg.name} mid-scroll overflow regression`);
        await page.evaluate(()=>scrollTo({top:0,left:0,behavior:'instant'}));await page.waitForTimeout(220);
      }

      assert.equal(errors.length,0,`${cfg.name} page errors: ${errors.join(' | ')}`);
      await page.locator('#boot').screenshot({path:`_site/qa-v379-editorial-grid-${cfg.name}.png`});
      console.log(JSON.stringify({qa:'v379.2.1-scene01-editorial-grid',viewport:cfg.name,status:'PASS',initial:s,mid}));
      await page.close();
    }

    const mobile=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:1});
    await mobile.goto('http://127.0.0.1:4173/',{waitUntil:'domcontentloaded',timeout:30000});
    await mobile.waitForFunction(()=>document.querySelector('[data-model-slot="boot-tv"]')?.dataset.glbState==='ready',null,{timeout:25000});
    const m=await inspect(mobile);
    assert.equal(m.layer,'v379-editorial-safe-zones');assert.equal(m.renderers,1);assert.deepEqual(m.activeSlots,['boot-tv']);assert.ok(m.overflow<=2);
    assert.ok(m.lineGaps.every(g=>g>=1),'mobile headline rhythm collapsed');
    assert.ok(m.copy.left>=16&&m.copy.right<=374,'mobile editorial content escaped natural gutters');
    await mobile.locator('#boot').screenshot({path:'_site/qa-v379-editorial-grid-mobile.png'});
    console.log(JSON.stringify({qa:'v379.2.1-scene01-editorial-grid',viewport:'mobile',status:'PASS',state:m}));
    await mobile.close();
  } finally {await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
