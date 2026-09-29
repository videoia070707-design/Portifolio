const {chromium}=require('playwright');const assert=require('node:assert/strict');const fs=require('node:fs');
(async()=>{
 const browser=await chromium.launch({args:['--no-sandbox','--use-angle=swiftshader','--enable-webgl','--ignore-gpu-blocklist']});const results=[];
 for(const cfg of [{name:'desktop',viewport:{width:1366,height:768}},{name:'mobile',viewport:{width:390,height:844},isMobile:true,hasTouch:true},{name:'narrow',viewport:{width:320,height:740},isMobile:true,hasTouch:true},{name:'reduced',viewport:{width:1366,height:768},reducedMotion:'reduce'},{name:'fallback',viewport:{width:390,height:844},isMobile:true,hasTouch:true}]){
 const p=await browser.newPage(cfg);const errors=[];p.on('pageerror',e=>errors.push(e.message));
 if(cfg.name==='fallback')await p.addInitScript(()=>{const original=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(kind,...args){return /webgl/.test(kind)?null:original.call(this,kind,...args)}});
 await p.goto('http://127.0.0.1:4173/',{waitUntil:'domcontentloaded'});await p.waitForFunction(()=>document.documentElement.dataset.crtInteractionReady==='true');await p.waitForFunction(()=>document.documentElement.dataset.motionIntro==='ready');
 if(cfg.name!=='fallback')await p.waitForFunction(()=>document.querySelector('[data-model-slot="boot-tv"]').dataset.glbState==='ready',null,{timeout:15000});
 else {await p.waitForFunction(()=>document.querySelector('[data-model-slot="boot-tv"]').dataset.glbState==='error');assert.ok(await p.locator('.crt-loading-poster').isVisible());}
 const buttons=p.locator('.boot-tags button');assert.equal(await buttons.count(),4);
 const ids=['direction','motion','ai','digital'];const hrefs=['social-media.html','video-editor.html','ai-creator.html','ui-ux.html'];
 for(let i=0;i<4;i++){
 await buttons.nth(i).click();assert.equal(await buttons.nth(i).getAttribute('aria-pressed'),'true');assert.equal(await p.locator('#crt-channel-panel a').getAttribute('href'),hrefs[i]);
 const text=await p.locator('#crt-channel-panel p[aria-live]').textContent();assert.ok(text.length>25);
 assert.ok(await buttons.nth(i).evaluate(el=>{const r=el.getBoundingClientRect();const hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return hit===el||el.contains(hit)}),'button clipped or obscured');
 }
 await buttons.nth(0).focus();await p.keyboard.press('Enter');assert.equal(await buttons.nth(0).getAttribute('aria-pressed'),'true');await p.keyboard.press('ArrowRight');assert.ok(await buttons.nth(1).evaluate(el=>el===document.activeElement));await p.keyboard.press('Space');assert.equal(await buttons.nth(1).getAttribute('aria-pressed'),'true');
 const layout=await p.evaluate(()=>{const b=document.querySelector('#boot .scene-inner').getBoundingClientRect();const panel=document.querySelector('#crt-channel-panel').getBoundingClientRect();const copy=document.querySelector('#boot .boot-copy').getBoundingClientRect();const stage=document.querySelector('#boot .boot-stage').getBoundingClientRect();const r=window.MOVX3D.runtime;return {overflow:document.documentElement.scrollWidth-innerWidth,panelInside:panel.bottom<=b.bottom+.5,panel:{top:panel.top,bottom:panel.bottom,height:panel.height},scene:{top:b.top,bottom:b.bottom,height:b.height},copy:{top:copy.top,bottom:copy.bottom,height:copy.height},stage:{top:stage.top,bottom:stage.bottom,height:stage.height},models:r.activeSlots,kind:document.querySelector('[data-model-slot="boot-tv"]').dataset.modelKind,triangles:r.instances['boot-tv']?.stats?.triangles,errors:r.errors,scroll:scrollY}});
 assert.ok(layout.overflow<=2);assert.ok(layout.panelInside,`channel panel clipped by scene: ${JSON.stringify(layout)}`);assert.deepEqual(layout.models,['boot-tv']);if(cfg.name!=='fallback'){assert.equal(layout.triangles,44831);assert.equal(layout.errors.length,0);}assert.equal(errors.length,0,errors.join('\n'));
 await p.evaluate(()=>scrollTo({top:0,behavior:'instant'}));await p.screenshot({path:`_site/qa-v359-${cfg.name}.png`,fullPage:false});
 if(cfg.isMobile)await p.locator('#boot').screenshot({path:`_site/qa-v359-${cfg.name}-scene.png`});
 results.push({name:cfg.name,status:'PASS',layout});await p.close();
 }
 await browser.close();fs.writeFileSync('_site/qa-v359-results.json',JSON.stringify(results,null,2));console.log(JSON.stringify(results));
})().catch(e=>{console.error(e);process.exit(1)});
