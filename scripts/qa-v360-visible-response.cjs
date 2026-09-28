const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({args:['--no-sandbox','--use-angle=swiftshader','--enable-webgl','--ignore-gpu-blocklist']});
 const results=[];
 for(const reduced of [false,true]){
  const page=await browser.newPage({viewport:{width:1366,height:900},reducedMotion:reduced?'reduce':'no-preference'});
  await page.goto(process.env.MOVX_TEST_URL||'http://127.0.0.1:4173/',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>document.querySelector('[data-model-slot="boot-tv"]')?.dataset.glbState==='ready',null,{timeout:30000});
  await page.waitForFunction(()=>document.documentElement.dataset.motionIntro==='ready');
  const rotation=()=>page.evaluate(()=>{const g=window.MOVX3D.runtime.instances['boot-tv'].group;return {x:g.rotation.x,y:g.rotation.y,z:g.rotation.z}});
  const modes={}; const images=[];
  for(const mode of ['direction','motion','ai','digital']){
   await page.locator(`[data-crt-mode-control="${mode}"]`).click();
   await page.mouse.move(5,5);await page.waitForTimeout(850);
   modes[mode]=await rotation();
   images.push(await page.locator('#boot canvas').screenshot({path:`_site/qa-v360-${reduced?'reduced':'normal'}-${mode}.png`}));
  }
  assert.ok(Math.abs(modes.direction.y-modes.motion.y)>.8,'Channel clicks must visibly rotate the actual mesh, including reduced motion');
  for(let i=1;i<images.length;i++)assert.ok(!images[i].equals(images[i-1]),'Rendered canvas did not change');
  const before=await rotation();await page.locator('[data-crt-mode-control="digital"]').click();await page.mouse.move(5,5);await page.waitForTimeout(500);const repeat=await rotation();
  assert.ok(Math.abs(before.y-repeat.y)<.03,'Repeated click must retain the selected channel');
  if(!reduced){
   await page.mouse.move(40,380);await page.waitForTimeout(800);const left=await rotation();
   await page.mouse.move(1280,380);await page.waitForTimeout(800);const right=await rotation();
   assert.ok(Math.abs(left.y-right.y)>.65,'Cursor across the opening must produce visible depth');
   results.push({reduced,modes,cursorDelta:Math.abs(left.y-right.y)});
  }else results.push({reduced,modes});
  await page.close();
 }
 await browser.close();console.log(JSON.stringify(results));
})().catch(e=>{console.error(e);process.exit(1)});
