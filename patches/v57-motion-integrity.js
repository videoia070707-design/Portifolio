/* MOVX v57 — motion integrity watchdog
   Detects animation states that remain hidden after entering the viewport and rescues only the stuck readable/media layer. */
(()=>{
  const root=document.documentElement;
  root.classList.add('movx-v57');
  root.dataset.movxMotionIntegrity='v57';
  const buildId='v57-motion-integrity';
  const enforceBuild=()=>{if(root.dataset.movxBuild!==buildId)root.dataset.movxBuild=buildId;};
  enforceBuild();
  /* Module scripts can finish after this classic watchdog. Keep the final production owner stable. */
  if('MutationObserver'in window){
    const buildObserver=new MutationObserver(()=>enforceBuild());
    buildObserver.observe(root,{attributes:true,attributeFilter:['data-movx-build']});
  }
  queueMicrotask(enforceBuild);
  setTimeout(enforceBuild,600);
  setTimeout(enforceBuild,1800);

  const reduced=new URLSearchParams(location.search).has('static')||matchMedia('(prefers-reduced-motion: reduce)').matches;
  const sections=[...document.querySelectorAll('#heroTop,#livingArchive,#nicheIndex,#archiveControls,.projects-list,#about,#services,#process,#contact')];
  const readableSelector='h1,h2,h3,p,strong,.kicker,[data-i18n],[data-i18n-html],label,button,a';
  const entered=new WeakSet();
  const timers=new WeakMap();
  const mediaTimers=new WeakMap();
  const registeredMedia=new WeakSet();

  function intersects(rect,margin=0){return rect.bottom>-margin&&rect.top<innerHeight+margin&&rect.right>-margin&&rect.left<innerWidth+margin;}
  function decorative(el){return !!el.closest('[aria-hidden="true"],.v42-parallax-layer,.v49-journey-stage,.v52-architecture-stage,.v54-portal-sequence,.v55-process-canvas,.v55-process-hud,.v55-process-depth,.v55-process-outro,.v56-handoff-layer');}
  function activeProcessText(el){
    const row=el.closest('#process .process-list li');
    return !row||row.classList.contains('v55-current')||innerWidth<=980;
  }
  function triggerAuthoredReveals(scope){
    if(!scope)return;
    scope.querySelectorAll('.reveal,.mask-reveal').forEach(el=>{
      if(decorative(el))return;
      el.classList.add('in');
      el.dataset.v57RevealTriggered='true';
    });
  }
  function rescueElement(el){
    if(!el||decorative(el)||!activeProcessText(el))return;
    el.classList.add('v57-text-rescue');
    el.dataset.v57Rescued='true';
  }
  function rescueMedia(el){
    if(!el||el.dataset.v57MediaRescued==='true')return;
    const r=el.getBoundingClientRect();
    if(!intersects(r,80))return;
    const img=el.matches('img')?el:el.querySelector('img');
    if(img){
      img.loading='eager';
      try{img.fetchPriority='high';}catch(_){}
      if(img.decode)img.decode().catch(()=>{});
    }
    el.classList.add('in','v57-media-rescue');
    el.dataset.v57MediaRescued='true';
  }
  function inspectMedia(el){
    if(!el||!intersects(el.getBoundingClientRect(),80))return;
    const cs=getComputedStyle(el);
    const opacity=parseFloat(cs.opacity||'1');
    const clip=cs.clipPath||cs.webkitClipPath||'';
    const hiddenByClip=clip&&clip!=='none'&&(/100%/.test(clip)||/inset\([^)]*9[5-9]%/.test(clip));
    if(!el.classList.contains('in')||opacity<.18||hiddenByClip)rescueMedia(el);
  }
  function enterMedia(el){
    if(!el)return;
    el.classList.add('in');
    clearTimeout(mediaTimers.get(el));
    const id=setTimeout(()=>inspectMedia(el),1450);
    mediaTimers.set(el,id);
  }
  function registerMedia(el){
    if(!el||registeredMedia.has(el))return;
    registeredMedia.add(el);
    if(reduced){el.classList.add('in');return;}
    if('IntersectionObserver'in window)mediaObserver.observe(el);
    else if(intersects(el.getBoundingClientRect(),80))enterMedia(el);
  }
  const mediaObserver='IntersectionObserver'in window?new IntersectionObserver(entries=>{
    entries.forEach(entry=>{
      if(!entry.isIntersecting)return;
      const el=entry.target;
      mediaObserver.unobserve(el);
      enterMedia(el);
    });
  },{threshold:[.03,.1,.24],rootMargin:'12% 0px 12% 0px'}):null;
  function registerMediaWithin(scope=document){
    if(scope.matches?.('.media-reveal'))registerMedia(scope);
    scope.querySelectorAll?.('.media-reveal').forEach(registerMedia);
  }

  function inspectSection(section){
    if(!section||!entered.has(section))return;
    const rect=section.getBoundingClientRect();
    if(!intersects(rect))return;
    triggerAuthoredReveals(section);
    section.querySelectorAll(readableSelector).forEach(el=>{
      if(decorative(el)||!activeProcessText(el))return;
      const r=el.getBoundingClientRect();
      if(r.width<2||r.height<2||!intersects(r))return;
      const cs=getComputedStyle(el);
      const opacity=parseFloat(cs.opacity||'1');
      if(cs.display==='none'||cs.visibility==='hidden'||opacity<.13){rescueElement(el);return;}
      if((el.classList.contains('reveal')||el.closest('.reveal'))&&opacity<.35)rescueElement(el);
    });
    section.querySelectorAll('.media-reveal').forEach(el=>{
      if(intersects(el.getBoundingClientRect(),80)&&!el.classList.contains('in'))enterMedia(el);
      else if(el.classList.contains('in'))inspectMedia(el);
    });
    if(section.id==='contact'){
      const grid=section.querySelector('.contact-grid');
      if(grid&&intersects(grid.getBoundingClientRect())&&parseFloat(getComputedStyle(grid).opacity||'1')<.72)grid.classList.add('v57-reveal-rescue');
    }
  }
  function scheduleInspect(section){
    clearTimeout(timers.get(section));
    const id=setTimeout(()=>inspectSection(section),reduced?0:900);
    timers.set(section,id);
  }

  if('IntersectionObserver'in window){
    const io=new IntersectionObserver(entries=>{
      entries.forEach(entry=>{
        if(entry.isIntersecting){
          entered.add(entry.target);
          entry.target.dataset.v57Entered='true';
          triggerAuthoredReveals(entry.target);
          scheduleInspect(entry.target);
        }
      });
    },{threshold:[.08,.22,.45],rootMargin:'4% 0px -6% 0px'});
    sections.forEach(section=>io.observe(section));
  }else{
    sections.forEach(section=>{entered.add(section);section.dataset.v57Entered='true';triggerAuthoredReveals(section);inspectSection(section);});
  }

  registerMediaWithin(document);
  const dynamicHosts=[document.querySelector('#projectsList'),document.querySelector('#archiveGrid'),document.querySelector('#loopWall'),document.querySelector('#caseSlides')].filter(Boolean);
  if('MutationObserver'in window&&dynamicHosts.length){
    const mutationObserver=new MutationObserver(mutations=>{
      mutations.forEach(mutation=>mutation.addedNodes.forEach(node=>{
        if(node.nodeType===1)registerMediaWithin(node);
      }));
    });
    dynamicHosts.forEach(host=>mutationObserver.observe(host,{childList:true,subtree:true}));
  }

  let auditRaf=0;
  function onScroll(){
    if(auditRaf)return;
    auditRaf=requestAnimationFrame(()=>{
      auditRaf=0;
      sections.forEach(section=>{if(entered.has(section)&&intersects(section.getBoundingClientRect()))scheduleInspect(section);});
      document.querySelectorAll('.media-reveal').forEach(el=>{
        if(intersects(el.getBoundingClientRect(),80)&&!el.classList.contains('in'))enterMedia(el);
      });
    });
  }
  addEventListener('scroll',onScroll,{passive:true});
  addEventListener('resize',onScroll,{passive:true});

  function auditVisibleText(){
    const issues=[];
    document.querySelectorAll(readableSelector).forEach(el=>{
      if(decorative(el)||!activeProcessText(el))return;
      const r=el.getBoundingClientRect();
      if(r.width<2||r.height<2||!intersects(r))return;
      const cs=getComputedStyle(el),opacity=parseFloat(cs.opacity||'1'),font=parseFloat(cs.fontSize||'16');
      const text=(el.textContent||'').trim().replace(/\s+/g,' ').slice(0,90);
      if(!text)return;
      if(cs.display==='none'||cs.visibility==='hidden'||opacity<.2)issues.push({type:'hidden',text,opacity,selector:el.tagName.toLowerCase()+(el.id?'#'+el.id:'')});
      if(font<8)issues.push({type:'tiny',text,font});
      if((/H[1-3]|STRONG/.test(el.tagName))&&(r.left<-4||r.right>innerWidth+4))issues.push({type:'horizontal-clip',text,left:Math.round(r.left),right:Math.round(r.right),vw:innerWidth});
    });
    return issues;
  }
  function auditVisibleMedia(){
    const issues=[];
    document.querySelectorAll('.media-reveal').forEach(el=>{
      const r=el.getBoundingClientRect();
      if(r.width<8||r.height<8||!intersects(r,8))return;
      const cs=getComputedStyle(el),opacity=parseFloat(cs.opacity||'1'),clip=cs.clipPath||cs.webkitClipPath||'';
      if(!el.classList.contains('in')||opacity<.18||(clip&&clip!=='none'&&/100%/.test(clip)))issues.push({type:'stuck-media',className:el.className,opacity,clip});
    });
    return issues;
  }

  window.__MOVX_V57_AUDIT__={
    sample(){
      enforceBuild();
      const current=document.querySelector('#process .process-list li.v55-current');
      const currentText=current?[...current.querySelectorAll('strong,p')].map(el=>({text:(el.textContent||'').trim(),opacity:parseFloat(getComputedStyle(el).opacity||'1'),rect:el.getBoundingClientRect().toJSON?.()||{left:el.getBoundingClientRect().left,right:el.getBoundingClientRect().right,top:el.getBoundingClientRect().top,bottom:el.getBoundingClientRect().bottom}})):[];
      const activeService=document.querySelector('#services .service-row.v42-reading');
      return {
        build:root.dataset.movxBuild||'',
        chapter:root.dataset.movxJourneyChapter||'',
        processStep:root.dataset.v55Step||'',
        contactPhase:root.dataset.v56Phase||'',
        overflow:document.documentElement.scrollWidth-innerWidth,
        rescued:document.querySelectorAll('[data-v57-rescued="true"]').length,
        mediaRescued:document.querySelectorAll('[data-v57-media-rescued="true"]').length,
        revealTriggered:document.querySelectorAll('[data-v57-reveal-triggered="true"]').length,
        visibleTextIssues:auditVisibleText(),
        visibleMediaIssues:auditVisibleMedia(),
        currentText,
        perceptual:{
          ghostOpacity:parseFloat(getComputedStyle(document.querySelector('#about .v42-parallax-ghost')||root).opacity||'0'),
          activeServiceOpacity:activeService?parseFloat(getComputedStyle(activeService).opacity||'1'):null,
          processCanvasFilter:getComputedStyle(document.querySelector('#process .v55-process-canvas')||root).filter||'none'
        }
      };
    },
    inspect(){
      enforceBuild();
      sections.forEach(section=>{entered.add(section);triggerAuthoredReveals(section);inspectSection(section);});
      document.querySelectorAll('.media-reveal').forEach(el=>{
        if(intersects(el.getBoundingClientRect(),80)&&!el.classList.contains('in'))enterMedia(el);
        else if(el.classList.contains('in'))inspectMedia(el);
      });
      return this.sample();
    }
  };

  Promise.resolve(document.fonts?.ready).catch(()=>{}).finally(()=>{
    root.classList.add('v57-fonts-ready');
    enforceBuild();
    setTimeout(()=>window.__MOVX_V57_AUDIT__.inspect(),reduced?0:1100);
  });
})();
