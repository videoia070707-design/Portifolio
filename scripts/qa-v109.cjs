const {chromium}=require('playwright');
const fs=require('node:fs/promises');
(async()=>{
  const browser=await chromium.launch({headless:true});
  const report=[];
  const page=await browser.newPage({viewport:{width:1440,height:900},reducedMotion:'no-preference'});
  const errors=[];page.on('pageerror',e=>errors.push(String(e)));
  await page.goto('http://127.0.0.1:4173/social-media.html',{waitUntil:'networkidle'});
  await page.waitForFunction(()=>document.documentElement.dataset.movxV108==='institutional-depth');
  await page.waitForFunction(()=>['ready','fallback'].includes(document.documentElement.dataset.v108Webgl),null,{timeout:8000});

  async function capture(name,fraction){
    const target=await page.evaluate(fraction=>{
      const el=document.querySelector('#process .v55-process-journey');
      const top=el.getBoundingClientRect().top+scrollY;
      const travel=Math.max(1,el.offsetHeight-innerHeight);
      return Math.round(top+travel*fraction);
    },fraction);
    await page.evaluate(y=>scrollTo({top:y,behavior:'instant'}),target);
    await page.waitForTimeout(420);
    const state=await page.evaluate(()=>{
      const rows=[...document.querySelectorAll('#process .process-list li')];
      const visible=rows.filter(row=>{
        const cs=getComputedStyle(row);
        return cs.visibility!=='hidden'&&parseFloat(cs.opacity)>.15;
      });
      const active=document.querySelector('#process .process-list li.v108-process-active');
      const activeBox=active?.getBoundingClientRect();
      const title=document.querySelector('#process .process-title');
      const titleBox=title?.getBoundingClientRect();
      const canvas=document.querySelector('#process .v108-process-canvas');
      const canvasStyle=canvas?getComputedStyle(canvas):null;
      return {
        step:document.documentElement.dataset.movxProcessStep,
        visibleRows:visible.length,
        activeRows:document.querySelectorAll('#process .process-list li.v108-process-active').length,
        activeBox:activeBox?{left:activeBox.left,right:activeBox.right,top:activeBox.top,bottom:activeBox.bottom}:null,
        titleBox:titleBox?{left:titleBox.left,right:titleBox.right,top:titleBox.top,bottom:titleBox.bottom}:null,
        clipPath:canvasStyle?.clipPath||canvasStyle?.webkitClipPath||'',
        canvasOpacity:canvasStyle?parseFloat(canvasStyle.opacity):0,
        oldSculptures:[...document.querySelectorAll('#services > .v106-chapter-sculpture,#process > .v106-chapter-sculpture,#contact > .v106-chapter-sculpture')].filter(el=>getComputedStyle(el).display!=='none').length,
        overflow:document.documentElement.scrollWidth-innerWidth
      };
    });
    if(state.visibleRows!==1||state.activeRows!==1||!state.activeBox||state.activeBox.right>innerWidth*.46||!state.clipPath.includes('inset')||state.canvasOpacity<.45||state.oldSculptures!==0||state.overflow>2)throw Error(JSON.stringify({name,state}));
    await page.screenshot({path:`_site/qa-v109-${name}.png`,fullPage:false});
    report.push({name,fraction,state});
    return state;
  }

  const a=await capture('process-start',.10);
  const b=await capture('process-mid',.50);
  const c=await capture('process-end',.90);
  if(!(Number(a.step)<=2&&Number(b.step)>=2&&Number(b.step)<=4&&Number(c.step)>=4))throw Error(JSON.stringify({a,b,c}));

  const mobile=await browser.newPage({viewport:{width:390,height:844},reducedMotion:'no-preference'});
  await mobile.goto('http://127.0.0.1:4173/social-media.html',{waitUntil:'networkidle'});
  await mobile.waitForFunction(()=>document.documentElement.dataset.movxV108==='institutional-depth');
  await mobile.waitForTimeout(320);
  const m=await mobile.evaluate(()=>({
    rows:[...document.querySelectorAll('#process .process-list li')].filter(row=>getComputedStyle(row).visibility!=='hidden').length,
    canvas:getComputedStyle(document.querySelector('#process .v108-process-canvas')).display,
    overflow:document.documentElement.scrollWidth-innerWidth
  }));
  if(m.rows<4||m.canvas!=='none'||m.overflow>2)throw Error(JSON.stringify({mobile:m}));
  report.push({mobile:m});

  if(errors.length)throw Error(errors.join('\n'));
  await fs.writeFile('_site/qa-v109-report.json',JSON.stringify(report,null,2));
  await browser.close();
  console.log('MOVX v109: process copy/3D separation, single-step readability, legacy-scene ownership and mobile fallback validated.');
})().catch(e=>{console.error(e);process.exit(1)});
