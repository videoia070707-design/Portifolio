const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');

(async()=>{
  const models=fs.readdirSync('_site/models').filter(x=>x.toLowerCase().endsWith('.glb')).sort();
  assert.deepEqual(models,['movx-crt-tv.glb'],'v384 must keep exactly one production GLB');
  const browser=await chromium.launch({headless:true,args:['--no-sandbox','--use-angle=swiftshader','--enable-webgl','--ignore-gpu-blocklist']});
  try{
    const open=async opts=>{
      const p=await browser.newPage(opts);const errors=[];
      p.on('pageerror',e=>errors.push(String(e)));
      p.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
      await p.goto('http://127.0.0.1:4173/',{waitUntil:'domcontentloaded',timeout:30000});
      await p.waitForFunction(()=>document.documentElement.dataset.v384CompositionPolish==='v384-clean-spacing',null,{timeout:12000});
      await p.waitForFunction(()=>document.querySelector('[data-model-slot="boot-tv"]')?.dataset.glbState==='ready',null,{timeout:25000});
      await p.waitForFunction(()=>{const i=document.querySelector('#people .people-visual img');return i?.complete&&i.naturalWidth>0},null,{timeout:12000});
      return {p,errors};
    };

    const inspect=async page=>page.evaluate(()=>{
      const root=document.documentElement;
      const floats=[...document.querySelectorAll('#playground .float-zone > .float[data-model-slot]')].map(el=>{
        const r=el.getBoundingClientRect();
        return {cls:el.className,slot:el.dataset.modelSlot,left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height};
      });
      const overlaps=[];
      for(let i=0;i<floats.length;i++)for(let j=i+1;j<floats.length;j++){
        const a=floats[i],b=floats[j];
        const w=Math.max(0,Math.min(a.right,b.right)-Math.max(a.left,b.left));
        const h=Math.max(0,Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top));
        const area=w*h;
        const base=Math.max(1,Math.min(a.width*a.height,b.width*b.height));
        overlaps.push({a:a.slot,b:b.slot,area,ratio:area/base});
      }
      const people=document.querySelector('#people .people-visual img');
      const transform=getComputedStyle(people).transform;
      let scale=1;
      try{scale=new DOMMatrix(transform).a}catch{}
      return {
        marker:root.dataset.v384CompositionPolish,
        overflow:root.scrollWidth-innerWidth,
        renderers:document.querySelectorAll('.v322-model-renderer').length,
        activeSlots:window.MOVX3D?.runtime?.activeSlots||[],
        runtimeErrors:window.MOVX3D?.runtime?.errors||[],
        floats,overlaps,
        people:{scale,objectPosition:getComputedStyle(people).objectPosition,transform}
      };
    });

    const {p:page,errors}=await open({viewport:{width:1440,height:1000},deviceScaleFactor:1});
    const playground=page.locator('#playground');await playground.scrollIntoViewIfNeeded();await page.waitForTimeout(900);
    const d=await inspect(page);
    assert.equal(d.marker,'v384-clean-spacing');assert.equal(d.renderers,1);assert.deepEqual(d.activeSlots,['boot-tv']);assert.equal(d.runtimeErrors.length,0);assert.ok(d.overflow<=2);
    assert.equal(d.floats.length,5,'desktop Playground must keep five draggable tokens');
    const worst=d.overlaps.reduce((m,x)=>x.ratio>m.ratio?x:m,{ratio:0});
    assert.ok(worst.ratio<.08,`desktop Playground tokens overlap: ${JSON.stringify(worst)}`);
    const tops=d.floats.map(x=>x.top);assert.ok(Math.max(...tops)-Math.min(...tops)>300,'desktop Playground lost vertical composition spread');
    assert.ok(d.people.scale>=2.20,`desktop People crop too loose: ${d.people.scale}`);
    assert.equal(d.people.objectPosition,'100% 48%',`desktop People crop anchor changed: ${d.people.objectPosition}`);
    assert.equal(errors.length,0,`desktop page errors: ${errors.join(' | ')}`);
    await playground.screenshot({path:'_site/qa-v384-playground-desktop.png'});
    const people=page.locator('#people');await people.scrollIntoViewIfNeeded();await page.waitForTimeout(700);await people.screenshot({path:'_site/qa-v384-people-desktop.png'});
    console.log(JSON.stringify({qa:'v384.3-composition-polish',viewport:'desktop',status:'PASS',state:d}));
    await page.close();

    const {p:mobile,errors:mobileErrors}=await open({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:1});
    const mp=mobile.locator('#playground');await mp.scrollIntoViewIfNeeded();await mobile.waitForTimeout(700);
    const m=await inspect(mobile);
    assert.equal(m.marker,'v384-clean-spacing');assert.equal(m.renderers,1);assert.deepEqual(m.activeSlots,['boot-tv']);assert.equal(m.runtimeErrors.length,0);assert.ok(m.overflow<=2);
    assert.equal(m.floats.length,5,'mobile Playground token count changed');
    assert.ok(m.people.scale>=2.24,`mobile People crop too loose: ${m.people.scale}`);
    assert.equal(m.people.objectPosition,'100% 44%',`mobile People crop anchor changed: ${m.people.objectPosition}`);
    assert.equal(mobileErrors.length,0,`mobile page errors: ${mobileErrors.join(' | ')}`);
    await mp.screenshot({path:'_site/qa-v384-playground-mobile.png'});
    const mpe=mobile.locator('#people');await mpe.scrollIntoViewIfNeeded();await mobile.waitForTimeout(700);await mpe.screenshot({path:'_site/qa-v384-people-mobile.png'});
    console.log(JSON.stringify({qa:'v384.3-composition-polish',viewport:'mobile',status:'PASS',state:m}));
    await mobile.close();
  } finally {await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
