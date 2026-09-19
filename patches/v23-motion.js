/* MOVX v23 — planned section choreography
   Implements the Etapa 2 motion plan: hero handoff, About parallax,
   service stacking, process timeline, contact drift and softer reveals. */
(() => {
  'use strict';
  const params = new URLSearchParams(location.search);
  if (params.has('static')) return;

  const root = document.documentElement;
  root.classList.add('movx-motion-v23');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (v,min,max) => Math.max(min,Math.min(max,v));
  const lerp = (a,b,t) => a + (b-a)*t;

  /* Stop legacy reveal engines from firing a second, dry entrance. */
  const legacyTargets = document.querySelectorAll('.reveal,.mask-reveal,.media-reveal,.archive-head,.niche-card,.archive-card,.project-entry,.service-row,.process-list li,.contact-copy,.contact-form');
  legacyTargets.forEach(el => {
    el.dataset.movxEntered = '1';
    el.getAnimations?.().forEach(anim => {
      try { anim.cancel(); } catch(e) {}
    });
  });

  /* Hero gets a dedicated stage so scroll-linked movement never fights the image. */
  const heroStage = document.querySelector('.social-cover-art__stage');
  const heroImage = heroStage?.querySelector(':scope > .social-cover-art__image');
  let heroMotionStage = null;
  if (heroStage && heroImage && !heroImage.parentElement.classList.contains('movx-hero-parallax-stage')) {
    heroMotionStage = document.createElement('div');
    heroMotionStage.className = 'movx-hero-parallax-stage';
    heroImage.before(heroMotionStage);
    heroMotionStage.appendChild(heroImage);
  } else if (heroImage) heroMotionStage = heroImage.parentElement;

  /* About visual depth. */
  const about = document.getElementById('about');
  const aboutHeading = about?.querySelector('.about-heading');
  const aboutCopy = about?.querySelector('.about-copy');
  const aboutSignature = about?.querySelector('.about-signature');
  let aboutWord = about?.querySelector('.movx-about-soul');
  if (about && !aboutWord) {
    aboutWord = document.createElement('div');
    aboutWord.className = 'movx-about-soul';
    aboutWord.setAttribute('aria-hidden','true');
    aboutWord.textContent = 'SOUL';
    about.prepend(aboutWord);
  }

  /* Handoff lines make section changes feel connected rather than abrupt. */
  const handoffPairs = [
    document.querySelector('.projects-list'),
    about,
    document.getElementById('services'),
    document.getElementById('process')
  ].filter(Boolean);
  const handoffs = [];
  handoffPairs.forEach(section => {
    if (section.previousElementSibling?.classList.contains('movx-handoff')) return;
    const line = document.createElement('div');
    line.className = 'movx-handoff';
    line.setAttribute('aria-hidden','true');
    line.innerHTML = '<span></span>';
    section.before(line);
    handoffs.push(line);
  });

  /* Services are a progressing editorial stack. */
  const services = document.getElementById('services');
  const serviceRows = [...document.querySelectorAll('.service-row')];
  serviceRows.forEach((row,index) => row.style.setProperty('--service-index', index));

  /* Process timeline. */
  const process = document.getElementById('process');
  const processList = process?.querySelector('.process-list');
  const processSteps = [...(process?.querySelectorAll('.process-list li') || [])];

  /* Contact orbital line. */
  const contact = document.getElementById('contact');

  /* Softer reveal language: small distance, long settle, no repeated bounce. */
  const revealGroups = [
    ['.archive-head .kicker,.archive-head p,.niche-index .kicker,.work-archive .kicker', 'soft'],
    ['.archive-head h2,.section-intro h2,.about-heading h2,.process-title h2,.contact-copy h2', 'title'],
    ['.niche-card,.archive-card,.project-entry,.about-copy,.section-intro>p,.service-row,.process-list li,.contact-copy .kicker,.contact-copy>p,.contact-form', 'soft']
  ];
  const revealNodes = [];
  revealGroups.forEach(([selector,type]) => {
    document.querySelectorAll(selector).forEach(el => {
      if (el.dataset.v23Reveal) return;
      el.dataset.v23Reveal = type;
      revealNodes.push(el);
    });
  });

  if (reduce || !('IntersectionObserver' in window)) {
    revealNodes.forEach(el => el.classList.add('is-v23-in'));
  } else {
    const io = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        const parent = el.parentElement;
        const siblings = parent ? [...parent.children].filter(node => node.dataset?.v23Reveal) : [];
        const index = Math.max(0,siblings.indexOf(el));
        el.style.transitionDelay = `${Math.min(index*60,240)}ms`;
        requestAnimationFrame(() => el.classList.add('is-v23-in'));
        io.unobserve(el);
      });
    }, { threshold:.12, rootMargin:'0px 0px -10% 0px' });
    revealNodes.forEach(el => io.observe(el));
  }

  let ticking = false;
  const update = () => {
    ticking = false;
    const vh = innerHeight || 1;

    if (!reduce && heroMotionStage && heroStage) {
      const rect = heroStage.getBoundingClientRect();
      const p = clamp(-rect.top / Math.max(rect.height,1), 0, 1);
      const y = lerp(0,-18,p);
      const scale = lerp(1.02,1.045,p);
      heroMotionStage.style.transform = `translate3d(0,${y.toFixed(2)}px,0) scale(${scale.toFixed(4)})`;
    }

    if (about) {
      const r = about.getBoundingClientRect();
      const p = clamp((vh-r.top)/(vh+r.height),0,1);
      const centered = p-.5;
      if (!reduce) {
        aboutHeading && (aboutHeading.style.transform = `translate3d(0,${lerp(26,-12,p).toFixed(2)}px,0)`);
        aboutCopy && (aboutCopy.style.transform = `translate3d(0,${lerp(12,-4,p).toFixed(2)}px,0)`);
        aboutSignature && (aboutSignature.style.transform = `translate3d(${lerp(-14,18,p).toFixed(2)}px,0,0)`);
        aboutWord && (aboutWord.style.transform = `translate3d(${(centered*-42).toFixed(2)}px,calc(-50% + ${(centered*24).toFixed(2)}px),0)`);
      }
      about.classList.toggle('is-motion-active', p > .28 && p < .88);
    }

    if (services && serviceRows.length) {
      const sr = services.getBoundingClientRect();
      const viewportAnchor = vh*.36;
      let bestIndex = 0;
      let bestDistance = Infinity;
      serviceRows.forEach((row,index) => {
        const rr = row.getBoundingClientRect();
        const d = Math.abs(rr.top - viewportAnchor);
        if (d < bestDistance) { bestDistance = d; bestIndex = index; }
      });
      serviceRows.forEach((row,index) => {
        row.classList.toggle('is-current', index === bestIndex && sr.top < vh*.82 && sr.bottom > vh*.18);
        row.classList.toggle('is-past', index < bestIndex && sr.top < vh*.82);
      });
    }

    if (process && processList && processSteps.length) {
      const pr = process.getBoundingClientRect();
      const progress = clamp((vh*.62 - pr.top)/Math.max(pr.height-vh*.22,1),0,1);
      processList.style.setProperty('--movx-process-progress', `${(progress*100).toFixed(1)}%`);
      const active = Math.min(processSteps.length-1, Math.floor(progress*processSteps.length));
      processSteps.forEach((step,index) => {
        step.classList.toggle('is-process-active', index === active);
        step.classList.toggle('is-process-past', index < active);
        step.classList.toggle('is-process-muted', index > active+1);
      });
    }

    if (!reduce && contact) {
      const cr = contact.getBoundingClientRect();
      const p = clamp((vh-cr.top)/(vh+cr.height),0,1);
      contact.style.setProperty('--movx-contact-x', `${lerp(18,-10,p).toFixed(1)}px`);
      contact.style.setProperty('--movx-contact-y', `${lerp(-10,14,p).toFixed(1)}px`);
    }

    if (!reduce && handoffs.length) {
      handoffs.forEach(line => {
        const r = line.getBoundingClientRect();
        const p = clamp((vh-r.top)/vh,0,1);
        line.style.setProperty('--movx-handoff-x', `${(p*118).toFixed(1)}vw`);
      });
    }
  };
  const requestUpdate = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(update);
  };
  addEventListener('scroll', requestUpdate, { passive:true });
  addEventListener('resize', requestUpdate, { passive:true });
  requestUpdate();

  /* Language changes should not replay the whole page. */
  document.querySelector('.language-switcher')?.addEventListener('click', () => {
    requestAnimationFrame(() => revealNodes.forEach(el => el.classList.add('is-v23-in')));
  });
})();
