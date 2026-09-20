/* MOVX v57 — motion integrity watchdog
   Detects animation states that remain hidden after entering the viewport and rescues only the stuck readable layer. */
(()=>{
  const root=document.documentElement;
  root.classList.add('movx-v57');
  root.dataset.movxMotionIntegrity='v57';
  const reduced=new URLSearchParams(location.search).has('static')||matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp=(v,a=0,b=1)=>Math.min(b,Math.max(a,v));
  const sections=[...document.querySelectorAll('#heroTop,#livingArchive,#nicheIndex,#archiveControls,.projects-list,#about,#services,#process,#contact')];
  const readableSelector='h1,h2,h3,p,strong,.kicker,[data-i18n],[data-i18n-html],label,button,a';
  const entered=new WeakSet();
  const timers=new WeakMap();

  function intersects(rect){return rect.bottom>0&&rect.top<innerHeight&&rect.right>0&&rect.left<innerWidth;}
  function decorative(el){return !!el.closest('[aria-hidden="true"],.v42-parallax-layer,.v49-journey-stage,.v52-architecture-stage,.v54-portal-sequence,.v55-process-canvas,.v55-process-hud,.v55-process-depth,.v55-process-outro,.v56-handoff-layer');}
  function activeProcessText(el){
    const row=el.closest('#process .process-list li');
    return !row||row.classList.contains('v55-current')||innerWidth<=980;
  }
  function rescueElement(el){
    if(!el||decorative(el)||!activeProcessText(el))return;
    el.classList.add('v57-text-rescue');
    el.dataset.v57Rescued='true';
  }
  function inspectSection(section){
    if(!section||!entered.has(section))return;
    const rect=section.getBoundingClientRect();
    if(!intersects(rect))return;
    section.querySelectorAll(readableSelector).forEach(el=>{
      if(decorative(el)||!activeProcessText(el))return;
      const r=el.getBoundingClientRect();
      if(r.width<2||r.height<2||!intersects(r))return;
      const cs=getComputedStyle(el);
      const opacity=parseFloat(cs.opacity||'1');
      if(cs.display==='none'||cs.visibility==='hidden'||opacity<.13){rescueElement(el);return;}
      if((el.classList.contains('reveal')||el.closest('.reveal'))&&opacity<.35)rescueElement(el);
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
        if(entry.isIntersecting){entered.add(entry.target);entry.target.dataset.v57Entered='true';scheduleInspect(entry.target);}
      });
    },{threshold:[.08,.22,.45],rootMargin:'4% 0px -6% 0px'});
    sections.forEach(section=>io.observe(section));
  }else{
    sections.forEach(section=>{entered.add(section);section.dataset.v57Entered='true';inspectSection(section);});
  }

  let auditRaf=0;
  function onScroll(){
    if(auditRaf)return;
    auditRaf=requestAnimationFrame(()=>{
      auditRaf=0;
      sections.forEach(section=>{if(entered.has(section)&&intersects(section.getBoundingClientRect()))scheduleInspect(section);});
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

  window.__MOVX_V57_AUDIT__={
    sample(){
      const current=document.querySelector('#process .process-list li.v55-current');
      const currentText=current?[...current.querySelectorAll('strong,p')].map(el=>({text:(el.textContent||'').trim(),opacity:parseFloat(getComputedStyle(el).opacity||'1'),rect:el.getBoundingClientRect().toJSON?.()||{left:el.getBoundingClientRect().left,right:el.getBoundingClientRect().right,top:el.getBoundingClientRect().top,bottom:el.getBoundingClientRect().bottom}})):[];
      return {
        build:root.dataset.movxBuild||'',
        chapter:root.dataset.movxJourneyChapter||'',
        processStep:root.dataset.v55Step||'',
        contactPhase:root.dataset.v56Phase||'',
        overflow:document.documentElement.scrollWidth-innerWidth,
        rescued:document.querySelectorAll('[data-v57-rescued="true"]').length,
        visibleTextIssues:auditVisibleText(),
        currentText
      };
    },
    inspect(){sections.forEach(section=>{entered.add(section);inspectSection(section);});return this.sample();}
  };

  Promise.resolve(document.fonts?.ready).catch(()=>{}).finally(()=>{root.classList.add('v57-fonts-ready');setTimeout(()=>window.__MOVX_V57_AUDIT__.inspect(),reduced?0:1100);});
})();
