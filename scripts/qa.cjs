const { chromium } = require('playwright');
const { writeFile } = require('node:fs/promises');
(async()=>{

const release='v100-canonical-motion';
const browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-webgl','--ignore-gpu-blocklist']});
const page=await browser.newPage({viewport:{width:1440,height:900},deviceScaleFactor:1});
const pageErrors=[];
page.on('pageerror',err=>pageErrors.push(String(err)));
await page.goto('http://127.0.0.1:4173/v93.html?v=100-canonical-motion',{waitUntil:'networkidle'});
await page.waitForFunction(()=>window.__MOVX_V57_AUDIT__,null,{timeout:20000});
await page.waitForFunction(r=>document.documentElement.dataset.movxRelease===r,release,{timeout:10000});
await page.waitForFunction(()=>document.documentElement.dataset.movxChapterSignature==='v88-fold-continuity-single-owner',null,{timeout:10000});
await page.addStyleTag({content:'html,body{scroll-behavior:auto!important}'});

const report={release,desktop:[],process:[],mobile:[],case:[],accessibility:[],signature:{},pageErrors};
const signature=await page.evaluate(()=>({
  build:document.documentElement.dataset.movxBuild,
  release:document.documentElement.dataset.movxRelease,
  design:document.documentElement.dataset.movxDesign,
  chapter:document.documentElement.dataset.movxChapterSignature,
  classes:[...document.documentElement.classList],
  foldMarks:document.querySelectorAll('.v88-fold-mark').length,
  styles:[...document.styleSheets].map(s=>s.href||'').filter(Boolean)
}));
report.signature=signature;
for(const cls of ['movx-v84','movx-v85','movx-v86','movx-v87','movx-v88']){
  if(!signature.classes.includes(cls)) throw new Error(`Missing production class ${cls}`);
}
if(signature.build!==release||signature.release!==release) throw new Error('Release identity mismatch '+JSON.stringify(signature));
if(signature.foldMarks<2) throw new Error('v88 fold signature did not mount');
for(const sheet of ['v85-reference.css','v86-signature.css','v87-editorial.css','v88-chapter.css']){
  if(!signature.styles.some(x=>x.includes(sheet))) throw new Error(`Missing production stylesheet ${sheet}`);
}

async function sample(label){
  await page.waitForTimeout(780);
  const audit=await page.evaluate(()=>window.__MOVX_V57_AUDIT__.inspect());
  report.desktop.push({label,...audit});
  if(audit.build!==release) throw new Error(`${label}: wrong release build ${audit.build}`);
  if(audit.overflow>2) throw new Error(`${label}: horizontal overflow ${audit.overflow}`);
  const clips=audit.visibleTextIssues.filter(x=>x.type==='horizontal-clip');
  if(clips.length) throw new Error(`${label}: clipped text ${JSON.stringify(clips.slice(0,3))}`);
  return audit;
}
async function sectionShot(selector,name,offset=.12){
  await page.evaluate(({selector,offset})=>{
    const el=document.querySelector(selector); if(!el) throw new Error('Missing '+selector);
    const top=window.scrollY+el.getBoundingClientRect().top;
    window.scrollTo(0,Math.max(0,top-window.innerHeight*offset));
  },{selector,offset});
  const audit=await sample(name);
  await page.screenshot({path:`_site/qa-v93-${name}.png`,fullPage:false});
  return audit;
}

await page.screenshot({path:'_site/qa-v93-00-home.png',fullPage:false});
await sample('00-home');
for(const [selector,name,offset] of [
  ['#livingArchive','01-living-archive',.11],
  ['#nicheIndex','02-territories',.10],
  ['#archiveControls','03-directory',.08],
  ['.projects-list','04-selected-cases',.08],
  ['#about','05-about',.12],
  ['#services','06-services',.10]
]) await sectionShot(selector,name,offset);

await page.waitForSelector('.v55-process-journey',{state:'attached',timeout:15000});
for(const progress of [.08,.34,.62,.88]){
  await page.evaluate(progress=>{
    const s=document.querySelector('.v55-process-journey');
    const top=window.scrollY+s.getBoundingClientRect().top;
    const travel=Math.max(1,s.offsetHeight-window.innerHeight);
    window.scrollTo(0,top+travel*progress);
  },progress);
  await page.waitForTimeout(850);
  const state=await page.evaluate(()=>({
    audit:window.__MOVX_V57_AUDIT__.inspect(),
    current:document.querySelector('#process .process-list li.v55-current')?.innerText||''
  }));
  report.process.push({progress,...state});
  if(state.audit.overflow>2) throw new Error(`process ${progress}: overflow`);
  if(!state.current.trim()) throw new Error(`process ${progress}: missing active step`);
}

await sectionShot('#contact','07-contact',.08);
const v90State=await page.evaluate(()=>({
  contactBackground:getComputedStyle(document.querySelector('#contact')).backgroundColor,
  chapter:document.documentElement.dataset.movxCurrentChapter||'',
  territoryColumns:[...document.querySelectorAll('#nicheGrid>.niche-card')].slice(0,3).map(el=>getComputedStyle(el).gridColumnStart)
}));
report.desktop.push({label:'v90-style-state',...v90State});
if(v90State.contactBackground!=='rgb(5, 5, 5)') throw new Error('v90 contact art direction is not active '+JSON.stringify(v90State));

await page.evaluate(()=>window.scrollTo(0,0));
const keyboardOpener=page.locator('[data-open-project][role="button"][tabindex="0"]').first();
await keyboardOpener.waitFor({state:'visible',timeout:10000});
await keyboardOpener.evaluate(el=>el.dataset.v93QaOpener='1');
await keyboardOpener.focus();
await page.keyboard.press('Enter');
await page.waitForSelector('#caseViewer.open',{state:'visible',timeout:8000});
await page.waitForTimeout(220);
const keyboardOpen=await page.evaluate(()=>({
  release:document.documentElement.dataset.movxRelease||'',
  modal:document.querySelector('#caseViewer').getAttribute('aria-modal'),
  hidden:document.querySelector('#caseViewer').getAttribute('aria-hidden'),
  active:document.activeElement?.id||document.activeElement?.className||''
}));
if(keyboardOpen.release!==release||keyboardOpen.modal!=='true'||keyboardOpen.hidden!=='false'||keyboardOpen.active!=='caseClose'){
  throw new Error('Keyboard case open failed '+JSON.stringify(keyboardOpen));
}
await page.screenshot({path:'_site/qa-v93-08-case-hero.png',fullPage:false});
await page.keyboard.press('Escape');
await page.waitForFunction(()=>!document.querySelector('#caseViewer').classList.contains('open'),null,{timeout:5000});
await page.waitForTimeout(80);
const keyboardClose=await page.evaluate(()=>({
  hidden:document.querySelector('#caseViewer').getAttribute('aria-hidden'),
  restored:document.activeElement?.dataset?.v93QaOpener==='1'
}));
if(keyboardClose.hidden!=='true'||!keyboardClose.restored) throw new Error('Keyboard focus restoration failed '+JSON.stringify(keyboardClose));
report.accessibility.push({name:'keyboard-case-flow',open:keyboardOpen,close:keyboardClose});

const mobile=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1});
const mobileErrors=[];
mobile.on('pageerror',err=>mobileErrors.push(String(err)));
await mobile.goto('http://127.0.0.1:4173/v93.html?v=100-canonical-motion',{waitUntil:'networkidle'});
await mobile.waitForFunction(()=>window.__MOVX_V57_AUDIT__,null,{timeout:20000});
await mobile.waitForFunction(r=>document.documentElement.dataset.movxRelease===r,release,{timeout:10000});
await mobile.addStyleTag({content:'html,body{scroll-behavior:auto!important}'});

async function mobileShot(selector,name){
  await mobile.evaluate(selector=>{
    const el=document.querySelector(selector); if(!el) throw new Error('Missing '+selector);
    const top=window.scrollY+el.getBoundingClientRect().top;
    window.scrollTo(0,Math.max(0,top-72));
  },selector);
  await mobile.waitForTimeout(620);
  const state=await mobile.evaluate(()=>window.__MOVX_V57_AUDIT__.inspect());
  report.mobile.push({name,...state});
  if(state.overflow>2) throw new Error(`mobile ${name}: overflow ${state.overflow}`);
  await mobile.screenshot({path:`_site/qa-v93-mobile-${name}.png`,fullPage:false});
}

await mobile.screenshot({path:'_site/qa-v93-mobile-00-home.png',fullPage:false});
for(const [selector,name] of [
  ['#livingArchive','01-living-archive'],
  ['#nicheIndex','02-territories'],
  ['.projects-list','03-selected-cases'],
  ['#about','04-about'],
  ['#services','05-services'],
  ['#process','06-process'],
  ['#contact','07-contact']
]) await mobileShot(selector,name);

const mobileProcess=await mobile.evaluate(()=>({
  rows:[...document.querySelectorAll('#process .process-list li')].map(el=>({position:getComputedStyle(el).position,opacity:parseFloat(getComputedStyle(el).opacity||'1')}))
}));
if(mobileProcess.rows.some(x=>x.position==='absolute'||x.opacity<.88)) throw new Error('Mobile Process readability regression '+JSON.stringify(mobileProcess));
if(pageErrors.length) throw new Error('Desktop page errors: '+pageErrors.join(' | '));
if(mobileErrors.length) throw new Error('Mobile page errors: '+mobileErrors.join(' | '));

await writeFile('_site/qa-v93-report.json',JSON.stringify(report,null,2));
await mobile.close();
await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
