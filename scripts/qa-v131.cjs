const {chromium}=require('playwright');
const assert=require('node:assert/strict');

(async()=>{
  const browser=await chromium.launch({headless:true});
  try{
    const desktop=await browser.newPage({viewport:{width:1440,height:900},deviceScaleFactor:1});
    await desktop.addInitScript(()=>localStorage.setItem('movx-theme','dark'));
    await desktop.goto('http://127.0.0.1:4173/',{waitUntil:'networkidle'});

    const storyCards=desktop.locator('[data-movx-scroll-world="v117"] [data-world-story]');
    assert.equal(await storyCards.count(),4,'v131 must keep four video story beats');
    const positions=await storyCards.evaluateAll(cards=>cards.map(card=>{
      const r=card.getBoundingClientRect();
      return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height};
    }));
    positions.forEach((box,index)=>{
      assert.ok(box.left>=-2&&box.right<=1442&&box.top>=-2&&box.bottom<=902,`story ${index+1} must remain inside the desktop viewport: ${JSON.stringify(box)}`);
    });
    assert.ok(Math.abs(positions[1].left-positions[0].left)>90,`story 1/2 should not share the same left rail: ${JSON.stringify(positions)}`);
    assert.ok(Math.abs(positions[2].top-positions[1].top)>100,`story 2/3 should occupy visibly different vertical zones: ${JSON.stringify(positions)}`);
    const right3=1440-positions[2].right;
    const right4=1440-positions[3].right;
    assert.ok(Math.abs(right4-right3)>85,`story 3/4 should not share the same right rail: ${JSON.stringify({right3,right4})}`);
    await desktop.close();

    const mobile=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true});
    await mobile.addInitScript(()=>localStorage.setItem('movx-theme','dark'));
    await mobile.goto('http://127.0.0.1:4173/',{waitUntil:'networkidle'});
    const wall=mobile.locator('#livingArchive .loop-wall');
    assert.equal(await wall.count(),1,'mobile living archive wall must exist');
    await wall.scrollIntoViewIfNeeded();
    await mobile.waitForTimeout(500);

    const rows=wall.locator('.loop-row');
    assert.equal(await rows.count(),3,'mobile wall must preserve all three artwork rows');
    const movement=[];
    for(let index=0;index<3;index++){
      const row=rows.nth(index);
      const cards=row.locator('.loop-card');
      assert.ok(await cards.count()>=12,`mobile wall row ${index+1} must contain duplicated artwork cards`);
      const track=row.locator('.loop-track');
      const before=await track.evaluate(el=>{
        const s=getComputedStyle(el);
        return {transform:s.transform,animationName:s.animationName,animationPlayState:s.animationPlayState,display:s.display,width:el.scrollWidth};
      });
      assert.ok(before.animationName.includes('v131-mobile-wall-'),`row ${index+1} must use the v131 mobile conveyor animation: ${JSON.stringify(before)}`);
      assert.equal(before.animationPlayState,'running',`row ${index+1} mobile conveyor must be running`);
      assert.equal(before.display,'flex',`row ${index+1} track must stay a flex conveyor`);
      const visibleCards=await cards.evaluateAll(nodes=>nodes.filter(node=>{
        const r=node.getBoundingClientRect();
        return r.right>0&&r.left<innerWidth;
      }).length);
      assert.ok(visibleCards>=2,`row ${index+1} should expose more than one artwork across the mobile viewport, got ${visibleCards}`);
      movement.push({track,before:before.transform});
    }
    await mobile.waitForTimeout(900);
    for(let index=0;index<movement.length;index++){
      const after=await movement[index].track.evaluate(el=>getComputedStyle(el).transform);
      assert.notEqual(after,movement[index].before,`mobile wall row ${index+1} must visibly advance over time`);
    }
    await mobile.screenshot({path:'_site/qa-v131-mobile-wall.png',fullPage:false});
    await mobile.close();

    const reduced=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true});
    await reduced.emulateMedia({reducedMotion:'reduce'});
    await reduced.addInitScript(()=>localStorage.setItem('movx-theme','dark'));
    await reduced.goto('http://127.0.0.1:4173/',{waitUntil:'networkidle'});
    const reducedRow=reduced.locator('#livingArchive .loop-row').first();
    await reducedRow.scrollIntoViewIfNeeded();
    const reducedState=await reducedRow.evaluate(row=>{
      const track=row.querySelector('.loop-track');
      const rs=getComputedStyle(row);
      const ts=getComputedStyle(track);
      return {overflowX:rs.overflowX,scrollWidth:row.scrollWidth,clientWidth:row.clientWidth,animationName:ts.animationName,transform:ts.transform,cards:row.querySelectorAll('.loop-card').length};
    });
    assert.equal(reducedState.animationName,'none','reduced-motion mobile wall must not autoplay');
    assert.ok(['auto','scroll'].includes(reducedState.overflowX),`reduced-motion row must stay swipeable: ${JSON.stringify(reducedState)}`);
    assert.ok(reducedState.scrollWidth>reducedState.clientWidth*2,`reduced-motion row must expose multiple artworks by swipe: ${JSON.stringify(reducedState)}`);
    assert.ok(reducedState.cards>=12,'reduced-motion fallback must preserve the full duplicated row');
    await reduced.close();

    console.log(JSON.stringify({status:'passed',desktopStoryPositions:'varied',mobileRows:3,mobileMotion:'continuous',reducedMotion:'swipeable multi-art fallback'}));
  }finally{
    await browser.close();
  }
})().catch(error=>{console.error(error);process.exitCode=1});
