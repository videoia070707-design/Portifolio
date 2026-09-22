const {chromium}=require('playwright');
const fs=require('node:fs/promises');
(async()=>{
 const browser=await chromium.launch({headless:true});
 const report=[];
 const page=await browser.newPage({reducedMotion:'reduce'});
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 for(const width of [390,768,1024,1280,1440]){
  await page.setViewportSize({width,height:900});
  for(const path of ['social-media.html','video-editor.html','ai-creator.html','ui-ux.html']){
   await page.goto('http://127.0.0.1:4173/'+path,{waitUntil:'networkidle'});
   await page.locator('.v65-footer-disciplines a').last().waitFor();
   for(const lang of ['pt','en','es']){
    await page.locator('.language-switcher [data-lang="'+lang+'"]').click();
    const data=await page.evaluate(()=>{
     const visible=e=>e.getBoundingClientRect().width>0&&getComputedStyle(e).display!=='none';
     const box=e=>{const r=e.getBoundingClientRect();return {label:e.textContent.trim(),x:r.x,y:r.y,right:r.right,bottom:r.bottom}};
     const nodes=[...document.querySelectorAll('.header-row .wordmark,.header-row > .nav a,.header-row .header-actions > *,.v65-discipline-switcher a')].filter(visible).map(box);
     const collisions=[];for(let i=0;i<nodes.length;i++)for(let j=i+1;j<nodes.length;j++){const a=nodes[i],b=nodes[j];if(Math.min(a.right,b.right)-Math.max(a.x,b.x)>1&&Math.min(a.bottom,b.bottom)-Math.max(a.y,b.y)>1)collisions.push([a.label,b.label]);}
     return {collisions,overflow:document.documentElement.scrollWidth-innerWidth,links:document.querySelectorAll('.v65-footer-disciplines a').length,web:document.querySelectorAll('a[href="ui-ux.html"]').length,title:document.querySelector('h1')?.textContent};
    });
    if(data.collisions.length||data.overflow>2||data.links!==4||data.web<3)throw Error(JSON.stringify({width,path,lang,...data}));
    report.push({width,path,lang,...data});
   }
   if(path==='social-media.html'){
    const covers=page.locator('#projectsList .project-cover img');
    for(let i=0;i<await covers.count();i++){
     await covers.nth(i).scrollIntoViewIfNeeded();
     await covers.nth(i).evaluate(img=>img.decode());
    }
    const bad=await page.evaluate(()=>[...document.querySelectorAll('#projectsList .project-entry')].flatMap(entry=>{
     const img=entry.querySelector('.project-cover img'),title=entry.querySelector('h2');
     const copy=entry.querySelector('.project-copy'),cover=entry.querySelector('.project-cover');
     const r=img.getBoundingClientRect(),s=getComputedStyle(img),ts=getComputedStyle(title);
     const cr=copy.getBoundingClientRect(),mr=cover.getBoundingClientRect(),es=getComputedStyle(entry);
     const expected=img.naturalWidth/img.naturalHeight;
     const rows=es.gridTemplateRows.trim().split(/\s+/).filter(Boolean).length;
     const topDelta=Math.abs(cr.top-mr.top);
     const issues=[];
     if(Math.abs(r.width/r.height-expected)>.015||s.objectFit!=='contain'||s.transform!=='none')issues.push('artwork crop');
     if(parseFloat(ts.lineHeight)/parseFloat(ts.fontSize)<1.02||parseFloat(ts.letterSpacing)/parseFloat(ts.fontSize)<-.031)issues.push('tight title');
     if(innerWidth>980&&(rows!==1||topDelta>10))issues.push('split project rows');
     return issues.length?[{title:title.textContent,issues,ratio:r.width/r.height,expected,rows,topDelta}]:[];
    }));
    if(bad.length)throw Error(JSON.stringify({width,bad}));

    if(width===1280||width===1440){
     for(const slug of ['marina-gengival','belive-cashflow']){
      const entry=page.locator('#'+slug);
      await entry.scrollIntoViewIfNeeded();
      await page.waitForTimeout(80);
      await page.screenshot({path:`_site/qa-project-${slug}-${width}.png`});
     }
    }

    const opener=page.locator('#projectsList [data-open-project]').first();
    await opener.scrollIntoViewIfNeeded();
    await opener.click({force:true});
    await page.locator('#caseViewer.open').waitFor();
    const firstCaseImage=page.locator('#caseSlides .case-slide-frame img').first();
    await firstCaseImage.waitFor();
    await firstCaseImage.evaluate(img=>img.decode());
    await page.waitForTimeout(120);
    const caseLayout=await page.evaluate(()=>{
     const body=document.querySelector('.case-body');
     const info=document.querySelector('.case-info');
     const slides=document.querySelector('.case-slides');
     const img=document.querySelector('#caseSlides .case-slide-frame img');
     const title=document.querySelector('.case-hero__title');
     const hero=document.querySelector('.case-hero');
     const rationale=document.querySelector('.case-study-note p');
     const bodyStyle=getComputedStyle(body),imgStyle=getComputedStyle(img),titleStyle=getComputedStyle(title);
     const rationaleStyle=rationale?getComputedStyle(rationale):null;
     const r=img.getBoundingClientRect();
     const natural=img.naturalWidth/img.naturalHeight;
     const columns=bodyStyle.gridTemplateColumns.trim().split(/\s+/).filter(Boolean).length;
     const infoRect=info.getBoundingClientRect(),slidesRect=slides.getBoundingClientRect();
     return {
      columns,
      sideBySide:Math.abs(infoRect.top-slidesRect.top)<6&&infoRect.right<=slidesRect.left+2,
      imgTransform:imgStyle.transform,
      imgFit:imgStyle.objectFit,
      ratio:r.width/r.height,
      natural,
      titleLine:parseFloat(titleStyle.lineHeight)/parseFloat(titleStyle.fontSize),
      titleSize:parseFloat(titleStyle.fontSize),
      heroHeight:hero.getBoundingClientRect().height,
      rationaleSize:rationaleStyle?parseFloat(rationaleStyle.fontSize):0,
      rationaleLine:rationaleStyle?parseFloat(rationaleStyle.lineHeight)/parseFloat(rationaleStyle.fontSize):0
     };
    });
    const expectedColumns=width>980?2:1;
    if(caseLayout.columns!==expectedColumns||
       (width>980&&!caseLayout.sideBySide)||
       caseLayout.imgTransform!=='none'||
       caseLayout.imgFit!=='contain'||
       Math.abs(caseLayout.ratio-caseLayout.natural)>.015||
       caseLayout.titleLine<.96||
       (width>980&&caseLayout.heroHeight>650)||
       (width>980&&caseLayout.titleSize>90)||
       caseLayout.rationaleSize>17||
       caseLayout.rationaleLine<1.5){
      throw Error(JSON.stringify({width,caseLayout}));
    }
    report.push({width,path,caseLayout});
    await page.locator('#caseClose').click();
    await page.waitForFunction(()=>!document.querySelector('#caseViewer')?.classList.contains('open'));
   }
   if(width===390){
    await page.locator('.menu-button').click();
    await page.locator('.v65-mobile-disciplines a[href="ui-ux.html"]').waitFor({state:'visible'});
   }
   await page.screenshot({path:`_site/qa-layout-${path}-${width}.png`});
  }
 }
 if(errors.length)throw Error(errors.join('\n'));
 await fs.writeFile('_site/qa-layout-report.json',JSON.stringify(report,null,2));
 await browser.close();
 console.log('Layout integrity: 60 page/viewport/language combinations; original artwork ratios; aligned selected-project previews; four disciplines; compact split case studies.');
})().catch(e=>{console.error(e);process.exit(1)});
