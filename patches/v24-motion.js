/* MOVX v24 — cinematic motion engine
   Professional scroll-linked inertia, visible parallax and long-form pacing.
   Compatibility marker for previous validation: MOVX v23 — planned section choreography */
(() => {
  'use strict';
  const params = new URLSearchParams(location.search);
  if (params.has('static')) return;

  const root = document.documentElement;
  root.classList.add('movx-motion-v24');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (v,min,max) => Math.max(min,Math.min(max,v));
  const lerp = (a,b,t) => a + (b-a)*t;
  const invLerp = (a,b,v) => clamp((v-a)/(b-a || 1),0,1);
  const easeInOut = t => t*t*(3-2*t);

  document.querySelectorAll('.reveal,.mask-reveal,.media-reveal,.archive-head,.niche-card,.archive-card,.project-entry,.service-row,.process-list li,.contact-copy,.contact-form').forEach(el => {
    el.dataset.movxEntered = '1';
    el.getAnimations?.().forEach(anim => { try { anim.cancel(); } catch(_){} });
  });

  const hero = document.querySelector('.social-cover-art__stage');
  const heroImg = hero?.querySelector('.social-cover-art__image');
  let heroStage = null;
  if (hero && heroImg) {
    const old = heroImg.parentElement?.classList.contains('movx-hero-parallax-stage') ? heroImg.parentElement : null;
    if (old) {
      heroStage = old;
      old.classList.remove('movx-hero-parallax-stage');
      old.classList.add('movx-v24-hero-stage');
    } else if (heroImg.parentElement?.classList.contains('movx-v24-hero-stage')) {
      heroStage = heroImg.parentElement;
    } else {
      heroStage = document.createElement('div');
      heroStage.className = 'movx-v24-hero-stage';
      heroImg.before(heroStage);
      heroStage.appendChild(heroImg);
    }
  }

  const about = document.getElementById('about');
  const aboutHeading = about?.querySelector('.about-heading');
  const aboutCopy = about?.querySelector('.about-copy');
  const aboutSignature = about?.querySelector('.about-signature');
  about?.querySelector('.movx-about-soul')?.remove();
  let aboutWord = null;
  if (about) {
    aboutWord = document.createElement('div');
    aboutWord.className = 'movx-v24-about-word';
    aboutWord.setAttribute('aria-hidden','true');
    aboutWord.textContent = 'SOUL';
    about.prepend(aboutWord);
  }

  const chapters = [...document.querySelectorAll('#livingArchive,#nicheIndex,#archiveControls,.projects-list,#about,#services,#process,#contact')];
  chapters.forEach(ch => ch.classList.add('movx-chapter'));

  const services = document.getElementById('services');
  const serviceRows = [...document.querySelectorAll('.service-row')];
  serviceRows.forEach((row,index) => row.style.setProperty('--service-index', index));
  const process = document.getElementById('process');
  const processList = process?.querySelector('.process-list');
  const processSteps = [...(process?.querySelectorAll('.process-list li') || [])];
  const contact = document.getElementById('contact');

  const revealMap = [
    ['.archive-head .kicker,.archive-head>p,.section-intro>p,.about-copy,.contact-copy>p,.contact-form','body'],
    ['.archive-head h2,.section-intro h2,.about-heading h2,.process-title h2,.contact-copy h2','title'],
    ['.niche-card,.archive-card,.project-entry,.service-row,.process-list li','media']
  ];
  const revealNodes = [];
  revealMap.forEach(([selector,type]) => {
    document.querySelectorAll(selector).forEach((el,i) => {
      if (el.dataset.v24Reveal) return;
      el.dataset.v24Reveal = type;
      el.style.transitionDelay = `${Math.min((i%4)*70,210)}ms`;
      revealNodes.push(el);
    });
  });
  if (reduce || !('IntersectionObserver' in window)) {
    revealNodes.forEach(el => el.classList.add('is-v24-in'));
  } else {
    const io = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        requestAnimationFrame(() => entry.target.classList.add('is-v24-in'));
        io.unobserve(entry.target);
      });
    }, {threshold:.09,rootMargin:'0px 0px -7% 0px'});
    revealNodes.forEach(el => io.observe(el));
  }

  const dynamicRoots = ['archiveGrid','projectsList','nicheGrid'].map(id => document.getElementById(id)).filter(Boolean);
  const dynamicObserver = !reduce && 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-v24-in');
      dynamicObserver.unobserve(entry.target);
    });
  }, {threshold:.08,rootMargin:'0px 0px -6% 0px'}) : {observe:el=>el.classList.add('is-v24-in'),unobserve:()=>{}};
  const registerDynamic = scope => {
    scope.querySelectorAll('.niche-card,.archive-card,.project-entry').forEach((el,i) => {
      if (el.dataset.v24Reveal) return;
      el.dataset.v24Reveal = 'media';
      el.style.transitionDelay = `${Math.min((i%4)*60,180)}ms`;
      dynamicObserver.observe(el);
    });
  };
  dynamicRoots.forEach(rootEl => {
    registerDynamic(rootEl);
    new MutationObserver(() => registerDynamic(rootEl)).observe(rootEl,{childList:true,subtree:true});
  });

  const geo = new Map();
  const cacheGeometry = () => {
    [hero,about,services,process,contact,...chapters].filter(Boolean).forEach(el => {
      const r = el.getBoundingClientRect();
      geo.set(el,{top:r.top+scrollY,height:r.height});
    });
    serviceRows.forEach(el => {
      const r = el.getBoundingClientRect();
      geo.set(el,{top:r.top+scrollY,height:r.height});
    });
    processSteps.forEach(el => {
      const r = el.getBoundingClientRect();
      geo.set(el,{top:r.top+scrollY,height:r.height});
    });
  };
  cacheGeometry();
  addEventListener('resize',()=>requestAnimationFrame(cacheGeometry),{passive:true});
  addEventListener('load',()=>setTimeout(cacheGeometry,120),{once:true});

  let targetScroll = scrollY;
  let smoothScroll = scrollY;
  let last = performance.now();
  let raf = 0;
  const sectionProgress = (el,scrollPos,vh) => {
    const g = geo.get(el); if (!g) return 0;
    return invLerp(g.top-vh,g.top+g.height,scrollPos);
  };

  const frame = now => {
    raf = 0;
    const dt = Math.min(.05,(now-last)/1000 || .016);
    last = now;
    const alpha = 1 - Math.exp(-dt * 5.2);
    smoothScroll += (targetScroll - smoothScroll) * alpha;
    const vh = innerHeight || 1;
    const sw = smoothScroll;

    if (!reduce && heroStage && hero) {
      const g = geo.get(hero);
      const p = g ? invLerp(g.top,g.top+g.height,sw) : 0;
      const c = easeInOut(p);
      const y = lerp(12,-64,c);
      const scale = lerp(1.035,1.072,c);
      heroStage.style.transform = `translate3d(0,${y.toFixed(2)}px,0) scale(${scale.toFixed(4)})`;
    }

    if (!reduce && about) {
      const c = easeInOut(sectionProgress(about,sw,vh));
      aboutHeading && (aboutHeading.style.transform = `translate3d(0,${lerp(38,-28,c).toFixed(2)}px,0)`);
      aboutCopy && (aboutCopy.style.transform = `translate3d(0,${lerp(14,-22,c).toFixed(2)}px,0)`);
      aboutSignature && (aboutSignature.style.transform = `translate3d(${lerp(-24,30,c).toFixed(2)}px,0,0)`);
      aboutSignature?.style.setProperty('--movx-signature-progress',`${clamp((c-.15)/.7,0,1)*100}%`);
      aboutWord && (aboutWord.style.transform = `translate3d(${lerp(-82,78,c).toFixed(2)}px,calc(-50% + ${lerp(34,-28,c).toFixed(2)}px),0)`);
    }

    if (services && serviceRows.length) {
      serviceRows.forEach(row => {
        const g = geo.get(row); if (!g) return;
        const center = g.top - sw + g.height*.5;
        const distance = Math.abs(center - vh*.42);
        const focus = 1 - clamp(distance/(vh*.58),0,1);
        const c = easeInOut(focus);
        row.style.opacity = String(lerp(.38,1,c));
        row.style.transform = `translate3d(${lerp(-14,0,c).toFixed(2)}px,0,0) scale(${lerp(.985,1,c).toFixed(4)})`;
        row.style.setProperty('--movx-service-line',`${(c*100).toFixed(1)}%`);
        const h3 = row.querySelector('h3');
        if (h3) h3.style.transform = `translate3d(${lerp(-6,8,c).toFixed(2)}px,0,0)`;
      });
    }

    if (process && processList && processSteps.length) {
      const pg = geo.get(process);
      if (pg) {
        const progress = clamp((sw + vh*.58 - pg.top)/Math.max(pg.height-vh*.16,1),0,1);
        processList.style.setProperty('--movx-process-progress',`${(progress*100).toFixed(2)}%`);
      }
      let nearest = 0, nearestD = Infinity;
      processSteps.forEach((step,index) => {
        const g = geo.get(step); if (!g) return;
        const center = g.top - sw + g.height*.5;
        const d = Math.abs(center-vh*.52);
        if (d<nearestD){nearestD=d;nearest=index;}
        const focus = 1-clamp(d/(vh*.58),0,1);
        const c = easeInOut(focus);
        step.style.opacity = String(lerp(.34,1,c));
        step.style.transform = `translate3d(${lerp(-8,8,c).toFixed(2)}px,0,0)`;
        step.style.setProperty('--movx-dot-scale',String(lerp(.7,1.08,c)));
      });
      processSteps.forEach((step,index) => {
        step.classList.toggle('is-v24-current',index===nearest);
        step.classList.toggle('is-v24-past',index<nearest);
      });
    }

    if (!reduce && contact) {
      const c = easeInOut(sectionProgress(contact,sw,vh));
      contact.style.setProperty('--movx-contact-x',`${lerp(34,-26,c).toFixed(2)}px`);
      contact.style.setProperty('--movx-contact-y',`${lerp(-24,30,c).toFixed(2)}px`);
      contact.style.setProperty('--movx-contact-scale',String(lerp(.96,1.035,c)));
    }

    chapters.forEach(ch => {
      const p = sectionProgress(ch,sw,vh);
      ch.style.setProperty('--movx-rule',String(clamp((p-.02)/.35,0,1)));
    });

    if (Math.abs(targetScroll-smoothScroll) > .08) raf = requestAnimationFrame(frame);
  };

  const onScroll = () => {
    targetScroll = scrollY;
    if (!raf) raf = requestAnimationFrame(frame);
  };
  addEventListener('scroll',onScroll,{passive:true});
  if (!reduce) raf = requestAnimationFrame(frame);
  else chapters.forEach(ch => ch.style.setProperty('--movx-rule','1'));

  document.querySelector('.language-switcher')?.addEventListener('click',()=>setTimeout(cacheGeometry,80));
  const renderObserver = new MutationObserver(()=>requestAnimationFrame(cacheGeometry));
  dynamicRoots.forEach(el=>renderObserver.observe(el,{childList:true,subtree:true}));
})();
