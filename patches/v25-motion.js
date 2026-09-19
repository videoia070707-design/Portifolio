/* MOVX v25 — unified premium motion runtime
   Lenis + GSAP ScrollTrigger own all motion. No legacy engine competes for transforms. */
(() => {
  'use strict';
  const params = new URLSearchParams(location.search);
  const staticMode = params.has('static') || matchMedia('(prefers-reduced-motion: reduce)').matches;
  const root = document.documentElement;
  root.classList.add('movx-v25');

  const gsap = window.gsap;
  const ScrollTrigger = window.ScrollTrigger;
  const LenisCtor = window.Lenis;
  if (!gsap || !ScrollTrigger) {
    console.warn('MOVX v25: GSAP/ScrollTrigger unavailable; revealing static content.');
    return;
  }
  gsap.registerPlugin(ScrollTrigger);

  const q = (s,ctx=document) => ctx.querySelector(s);
  const qa = (s,ctx=document) => [...ctx.querySelectorAll(s)];

  /* 1) Single scroll source: Lenis feeds ScrollTrigger. */
  let lenis = null;
  let scrollVelocity = 0;
  if (!staticMode && LenisCtor) {
    lenis = new LenisCtor({
      lerp: 0.075,
      smoothWheel: true,
      wheelMultiplier: 0.9,
      touchMultiplier: 1.05,
      syncTouch: false,
      autoRaf: false
    });
    lenis.on('scroll', e => {
      scrollVelocity = e.velocity || 0;
      ScrollTrigger.update();
    });
    gsap.ticker.add(time => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
  }

  /* 2) 2.5D hero: approved Soul of Design artwork split into spatial planes. */
  const heroStage = q('.social-cover-art__stage');
  const heroImg = q('.social-cover-art__image', heroStage || document);
  if (heroStage && heroImg) {
    const src = heroImg.currentSrc || heroImg.getAttribute('src');
    heroStage.style.setProperty('--v25-hero', `url("${src}")`);
    let scene = q('.v25-hero-scene', heroStage);
    if (!scene) {
      scene = document.createElement('div');
      scene.className = 'v25-hero-scene';
      scene.innerHTML = `
        <div class="v25-hero-layer v25-hero-layer--base"></div>
        <div class="v25-hero-layer v25-hero-layer--type"></div>
        <div class="v25-hero-layer v25-hero-layer--crt"></div>
        <div class="v25-hero-layer v25-hero-layer--lower"></div>
        <div class="v25-hero-bloom"></div>
        <div class="v25-hero-grain"></div>`;
      heroStage.prepend(scene);
    }
    if (!staticMode) {
      const tl = gsap.timeline({
        defaults:{ease:'none'},
        scrollTrigger:{trigger:heroStage,start:'top top',end:'bottom top',scrub:1.65,invalidateOnRefresh:true}
      });
      tl.fromTo(q('.v25-hero-layer--base',scene),{yPercent:-1,scale:1.015},{yPercent:-7,scale:1.085},0)
        .fromTo(q('.v25-hero-layer--type',scene),{xPercent:-1.5,yPercent:0,scale:1.012},{xPercent:-4.2,yPercent:-3.6,scale:1.035},0)
        .fromTo(q('.v25-hero-layer--crt',scene),{xPercent:0,yPercent:0,scale:1.02,rotateZ:0},{xPercent:3.8,yPercent:-8.5,scale:1.075,rotateZ:.28},0)
        .fromTo(q('.v25-hero-layer--lower',scene),{xPercent:0,yPercent:1,scale:1.018},{xPercent:2.4,yPercent:-5.2,scale:1.055},0)
        .fromTo(q('.v25-hero-bloom',scene),{xPercent:-4,yPercent:2,scale:.96,opacity:.55},{xPercent:7,yPercent:-7,scale:1.15,opacity:1},0)
        .to('.hero-index',{y:-16},0);

      const moveX = gsap.quickTo(scene,'x',{duration:1.15,ease:'power3.out'});
      const moveY = gsap.quickTo(scene,'y',{duration:1.15,ease:'power3.out'});
      heroStage.addEventListener('pointermove', e => {
        const r = heroStage.getBoundingClientRect();
        const nx = (e.clientX-r.left)/r.width-.5;
        const ny = (e.clientY-r.top)/r.height-.5;
        moveX(nx*10); moveY(ny*7);
      },{passive:true});
      heroStage.addEventListener('pointerleave',()=>{moveX(0);moveY(0)},{passive:true});
    }
  }

  /* 3) Calm editorial reveals, including dynamic content. */
  const revealSelectors = [
    ['.archive-head .kicker,.archive-head>p,.section-intro>p,.about-copy,.contact-copy>p,.contact-form','copy'],
    ['.archive-head h2,.section-intro h2,.about-heading h2,.process-title h2,.contact-copy h2','title'],
    ['.niche-card,.archive-card,.project-entry','media']
  ];
  const registerReveals = (scope=document) => {
    revealSelectors.forEach(([selector,type]) => {
      qa(selector,scope).forEach((el,index) => {
        if (el.dataset.v25Reveal) return;
        el.dataset.v25Reveal = type;
        if (staticMode) { el.classList.add('v25-in'); return; }
        ScrollTrigger.create({
          trigger:el,start:'top 88%',once:true,
          onEnter:()=>setTimeout(()=>el.classList.add('v25-in'),Math.min((index%4)*55,165))
        });
      });
    });
  };
  registerReveals();
  ['archiveGrid','projectsList','nicheGrid'].forEach(id=>{
    const node=document.getElementById(id);
    if(node)new MutationObserver(()=>registerReveals(node)).observe(node,{childList:true,subtree:true});
  });

  /* 4) Three-row art wall: independent tracks, seamless loop, scroll-velocity modulation. */
  const wall = document.getElementById('loopWall');
  let conveyorStates = [];
  let conveyorLast = performance.now();
  const enhanceConveyors = () => {
    if (!wall) return;
    const rows = qa(':scope > .loop-row',wall);
    if (!rows.length) return;
    conveyorStates = rows.map((row,index)=>{
      const track=q('.loop-track',row); if(!track)return null;
      let stage=track.parentElement;
      if(!stage.classList.contains('v25-conveyor-stage')){
        const wrap=document.createElement('div');wrap.className='v25-conveyor-stage';track.before(wrap);wrap.appendChild(track);stage=wrap;
      }
      const cards=qa('.loop-card',track); const half=Math.floor(cards.length/2);
      let distance=half>0&&cards[half] ? cards[half].offsetLeft-cards[0].offsetLeft : track.scrollWidth/2;
      distance=Math.max(1,distance||track.scrollWidth/2);
      const prior=Number(stage.dataset.v25x);
      const state={row,track,stage,index,distance,x:Number.isFinite(prior)?prior:(index===1?-distance*.64:-distance*(index*.17)),dir:index===1?1:-1,base:[42,34,39][index]||38,pause:1,pauseTarget:1};
      while(state.x<=-distance)state.x+=distance;while(state.x>0)state.x-=distance;
      row.onpointerenter=()=>{state.pauseTarget=0;row.classList.add('is-v25-hovered')};
      row.onpointerleave=()=>{state.pauseTarget=1;row.classList.remove('is-v25-hovered')};
      return state;
    }).filter(Boolean);
  };
  if (wall) {
    enhanceConveyors();
    new MutationObserver(()=>requestAnimationFrame(enhanceConveyors)).observe(wall,{childList:true});
    addEventListener('resize',()=>requestAnimationFrame(enhanceConveyors),{passive:true});
    const conveyorFrame=now=>{
      const dt=Math.min(.05,(now-conveyorLast)/1000||.016);conveyorLast=now;
      const velocityBoost=Math.min(22,Math.abs(scrollVelocity)*.72);
      conveyorStates.forEach(s=>{
        s.pause += (s.pauseTarget-s.pause)*(1-Math.exp(-dt*6.5));
        const speed=(s.base+velocityBoost)*s.pause;
        s.x += s.dir*speed*dt;
        if(s.dir<0&&s.x<=-s.distance)s.x+=s.distance;
        if(s.dir>0&&s.x>=0)s.x-=s.distance;
        s.stage.dataset.v25x=String(s.x);
        s.stage.style.transform=`translate3d(${s.x.toFixed(2)}px,0,0)`;
      });
      requestAnimationFrame(conveyorFrame);
    };
    if(!staticMode)requestAnimationFrame(conveyorFrame);
  }

  /* 5) About: obvious but elegant multi-plane parallax. */
  const about=document.getElementById('about');
  if(about){
    let word=q('.v25-about-word',about);
    if(!word){word=document.createElement('div');word.className='v25-about-word';word.setAttribute('aria-hidden','true');word.textContent='SOUL';about.prepend(word)}
    if(!staticMode){
      gsap.fromTo(word,{xPercent:-8,yPercent:-42},{xPercent:8,yPercent:-57,ease:'none',scrollTrigger:{trigger:about,start:'top bottom',end:'bottom top',scrub:1.8}});
      gsap.fromTo(q('.about-heading',about),{y:72},{y:-54,ease:'none',scrollTrigger:{trigger:about,start:'top bottom',end:'bottom top',scrub:1.55}});
      gsap.fromTo(q('.about-copy',about),{y:28},{y:-36,ease:'none',scrollTrigger:{trigger:about,start:'top bottom',end:'bottom top',scrub:1.8}});
      gsap.fromTo(q('.about-signature',about),{x:-34},{x:48,ease:'none',scrollTrigger:{trigger:about,start:'top 85%',end:'bottom 20%',scrub:1.7,onUpdate:self=>about.style.setProperty('--v25-signature',`${(self.progress*100).toFixed(1)}%`)}});
    }
  }

  /* 6) Services: sticky editorial header + continuous focus per row. */
  const services=document.getElementById('services');
  if(services&&!staticMode){
    qa('.service-row',services).forEach(row=>{
      gsap.fromTo(row,{x:-28,opacity:.34,scale:.985},{
        x:0,opacity:1,scale:1,ease:'none',
        scrollTrigger:{trigger:row,start:'top 88%',end:'center 52%',scrub:1.15,onUpdate:self=>row.style.setProperty('--v25-service-line',`${(self.progress*100).toFixed(1)}%`)}
      });
      const h=q('h3',row);if(h)gsap.fromTo(h,{x:-8},{x:12,ease:'none',scrollTrigger:{trigger:row,start:'top 82%',end:'center 48%',scrub:1.3}});
    });
  }

  /* 7) Process: sticky chapter with progress line and depth focus. */
  const process=document.getElementById('process');
  if(process){
    const list=q('.process-list',process);const steps=qa('.process-list li',process);
    if(list&&!staticMode){
      ScrollTrigger.create({trigger:process,start:'top 70%',end:'bottom 35%',scrub:1.2,onUpdate:self=>list.style.setProperty('--v25-process',`${(self.progress*100).toFixed(2)}%`)});
      steps.forEach((step,index)=>{
        gsap.fromTo(step,{x:-16,opacity:.32},{x:8,opacity:1,ease:'none',scrollTrigger:{trigger:step,start:'top 88%',end:'center 54%',scrub:1.15,onUpdate:self=>step.style.setProperty('--v25-dot',(0.72+self.progress*.4).toFixed(3))}});
        ScrollTrigger.create({trigger:step,start:'center 58%',end:'bottom 45%',onEnter:()=>{steps.forEach(s=>s.classList.remove('v25-current'));step.classList.add('v25-current');steps.slice(0,index).forEach(s=>s.classList.add('v25-past'))}});
      });
    }
  }

  /* 8) Contact: slow spatial exit. */
  const contact=document.getElementById('contact');
  if(contact&&!staticMode){
    ScrollTrigger.create({trigger:contact,start:'top bottom',end:'bottom top',scrub:1.8,onUpdate:self=>{
      const p=self.progress;contact.style.setProperty('--v25-contact-x',`${gsap.utils.interpolate(48,-34,p)}px`);contact.style.setProperty('--v25-contact-y',`${gsap.utils.interpolate(-30,38,p)}px`);contact.style.setProperty('--v25-contact-scale',String(gsap.utils.interpolate(.94,1.05,p)));
    }});
  }

  /* 9) Chapter handoffs: structural rules draw with scroll. */
  const chapters=qa('#livingArchive,#nicheIndex,#archiveControls,.projects-list,#about,#services,#process,#contact');
  chapters.forEach(ch=>{
    ch.classList.add('v25-chapter');
    if(!staticMode)ScrollTrigger.create({trigger:ch,start:'top 92%',end:'top 56%',scrub:.9,onUpdate:self=>ch.style.setProperty('--v25-rule',String(self.progress))});
    else ch.style.setProperty('--v25-rule','1');
  });

  /* 10) Case viewer: slow editorial opening. */
  const viewer=document.getElementById('caseViewer');
  if(viewer&&!staticMode){
    new MutationObserver(()=>{
      if(!viewer.classList.contains('open'))return;
      viewer.classList.add('v25-opening');
      requestAnimationFrame(()=>{
        const hero=q('.case-hero__media img',viewer);
        if(hero)gsap.fromTo(hero,{scale:1.055,opacity:.5},{scale:1,opacity:1,duration:1.45,ease:'power3.out'});
        gsap.fromTo(qa('.case-study-block,.case-chapter-label,.case-study-note',viewer),{y:26,opacity:0},{y:0,opacity:1,duration:1.2,stagger:.055,ease:'power3.out',clearProps:'transform'});
      });
    }).observe(viewer,{attributes:true,attributeFilter:['class']});
  }

  new MutationObserver(()=>ScrollTrigger.refresh()).observe(document.body,{childList:true,subtree:true});
  addEventListener('load',()=>setTimeout(()=>ScrollTrigger.refresh(),220),{once:true});
})();
