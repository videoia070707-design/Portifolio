/* MOVX v29 — damped premium scroll choreography
   Native APIs only. Content remains visible if this enhancement fails. */
(() => {
  'use strict';
  const root = document.documentElement;
  const params = new URLSearchParams(location.search);
  const reduced = params.has('static') || matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(pointer:fine)').matches;
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const pageTop = el => el.getBoundingClientRect().top + window.scrollY;

  root.classList.add('movx-v29');
  if (reduced) return;

  try {
    const heroStage = document.querySelector('.social-cover-art__stage');
    const heroImage = heroStage?.querySelector('.social-cover-art__image');
    let heroOverlay = null;
    let pointerTargetX = 0, pointerTargetY = 0, pointerX = 0, pointerY = 0;

    if (heroStage && heroImage && finePointer && innerWidth > 900) {
      const src = heroImage.currentSrc || heroImage.getAttribute('src');
      heroOverlay = document.createElement('div');
      heroOverlay.className = 'v29-hero-overlay';
      heroOverlay.setAttribute('aria-hidden','true');
      heroOverlay.style.setProperty('--v29-hero-image', `url("${src}")`);
      heroOverlay.innerHTML = '<div class="v29-hero-plane v29-hero-plane--type"></div><div class="v29-hero-plane v29-hero-plane--crt"></div><div class="v29-hero-plane v29-hero-plane--lower"></div>';
      heroImage.insertAdjacentElement('afterend', heroOverlay);
      heroStage.addEventListener('pointermove', e => {
        const r = heroStage.getBoundingClientRect();
        pointerTargetX = (((e.clientX-r.left)/Math.max(1,r.width))-.5) * 12;
        pointerTargetY = (((e.clientY-r.top)/Math.max(1,r.height))-.5) * 8;
      }, { passive:true });
      heroStage.addEventListener('pointerleave', () => { pointerTargetX = 0; pointerTargetY = 0; }, { passive:true });
    }

    const about = document.getElementById('about');
    const services = document.getElementById('services');
    const serviceRows = services ? [...services.querySelectorAll('.service-row')] : [];
    const process = document.getElementById('process');
    const processList = process?.querySelector('.process-list');
    const processSteps = processList ? [...processList.querySelectorAll('li')] : [];
    const contact = document.getElementById('contact');
    const chapters = [document.getElementById('livingArchive'),document.getElementById('nicheIndex'),document.getElementById('archiveControls'),document.querySelector('.projects-list'),about,services,process,contact].filter(Boolean);
    chapters.forEach(ch => ch.classList.add('v29-chapter'));

    let targetY = scrollY;
    let smoothY = scrollY;
    let raf = 0;
    let lastTime = performance.now();

    const request = () => { if (!raf) raf = requestAnimationFrame(frame); };
    addEventListener('scroll', () => { targetY = scrollY; request(); }, { passive:true });
    addEventListener('resize', request, { passive:true });
    addEventListener('load', request, { once:true });

    const sectionProgress = el => {
      const top = pageTop(el);
      const h = Math.max(1, el.offsetHeight);
      return clamp((smoothY + innerHeight - top) / (innerHeight + h));
    };

    function frame(now) {
      raf = 0;
      const dt = Math.min(.05, Math.max(.001, (now-lastTime)/1000));
      lastTime = now;
      const alpha = 1 - Math.exp(-dt * 6.2);
      smoothY = lerp(smoothY, targetY, alpha);
      pointerX = lerp(pointerX, pointerTargetX, 1 - Math.exp(-dt * 5.2));
      pointerY = lerp(pointerY, pointerTargetY, 1 - Math.exp(-dt * 5.2));

      if (heroStage && heroOverlay) {
        const top = pageTop(heroStage);
        const h = Math.max(1, heroStage.offsetHeight);
        const p = clamp((smoothY-top)/h);
        heroStage.style.setProperty('--v29-hero-x', `${pointerX.toFixed(2)}px`);
        heroStage.style.setProperty('--v29-hero-y', `${(-p*20 + pointerY*.15).toFixed(2)}px`);
        heroStage.style.setProperty('--v29-hero-scale', (1.015 + p*.04).toFixed(4));
        heroStage.style.setProperty('--v29-type-x', `${(-pointerX*.28).toFixed(2)}px`);
        heroStage.style.setProperty('--v29-type-y', `${(-p*12 - pointerY*.08).toFixed(2)}px`);
        heroStage.style.setProperty('--v29-crt-x', `${(pointerX*.52).toFixed(2)}px`);
        heroStage.style.setProperty('--v29-crt-y', `${(-p*25 + pointerY*.22).toFixed(2)}px`);
        heroStage.style.setProperty('--v29-lower-x', `${(pointerX*.3).toFixed(2)}px`);
        heroStage.style.setProperty('--v29-lower-y', `${(-p*16 + pointerY*.14).toFixed(2)}px`);
      }

      if (about) {
        const p = sectionProgress(about);
        about.style.setProperty('--v29-about-x', `${lerp(-54,50,p).toFixed(2)}px`);
        about.style.setProperty('--v29-about-y', `${lerp(58,-52,p).toFixed(2)}px`);
        about.style.setProperty('--v29-about-heading-y', `${lerp(34,-22,p).toFixed(2)}px`);
        about.style.setProperty('--v29-about-copy-y', `${lerp(14,-16,p).toFixed(2)}px`);
        about.style.setProperty('--v29-about-signature-x', `${lerp(-20,26,p).toFixed(2)}px`);
      }

      serviceRows.forEach(row => {
        const top = pageTop(row) - smoothY;
        const center = top + row.offsetHeight/2;
        const focus = 1 - clamp(Math.abs(center-innerHeight*.55)/(innerHeight*.56));
        row.style.opacity = String(lerp(.52,1,focus));
        row.style.setProperty('--v29-service-line', `${(focus*100).toFixed(1)}%`);
        row.style.setProperty('--v29-service-title-x', `${lerp(0,14,focus).toFixed(2)}px`);
      });

      if (processList) {
        const top = pageTop(processList);
        const h = Math.max(1, processList.offsetHeight);
        const progress = clamp((smoothY + innerHeight*.56 - top)/h);
        let strongest = -1, strongestFocus = -1;
        processSteps.forEach((step,index) => {
          const relTop = pageTop(step)-smoothY;
          const center = relTop + step.offsetHeight/2;
          const focus = 1 - clamp(Math.abs(center-innerHeight*.52)/(innerHeight*.55));
          const opacity = lerp(.46,1,focus);
          const shift = lerp(16,0,focus);
          step.style.setProperty('--v29-step-opacity', opacity.toFixed(3));
          step.style.setProperty('--v29-step-x', `${shift.toFixed(2)}px`);
          step.style.setProperty('--v29-step-rule', (0.22 + focus*.78).toFixed(3));
          if (focus > strongestFocus) { strongestFocus = focus; strongest = index; }
        });
        processSteps.forEach((step,index)=>step.classList.toggle('v29-current',index===strongest && strongestFocus>.38));
        processList.style.setProperty('--v29-progress', `${(progress*100).toFixed(1)}%`);
      }

      if (contact) {
        const p = sectionProgress(contact);
        contact.style.setProperty('--v29-contact-x', `${lerp(42,-28,p).toFixed(1)}px`);
        contact.style.setProperty('--v29-contact-y', `${lerp(-24,34,p).toFixed(1)}px`);
        contact.style.setProperty('--v29-contact-scale', lerp(.96,1.04,p).toFixed(4));
      }

      chapters.forEach(ch => {
        const top = pageTop(ch) - smoothY;
        const p = clamp((innerHeight*.93-top)/(innerHeight*.42));
        ch.style.setProperty('--v29-rule', p.toFixed(4));
      });

      if (Math.abs(targetY-smoothY) > .12 || Math.abs(pointerX-pointerTargetX)>.08 || Math.abs(pointerY-pointerTargetY)>.08) request();
    }

    request();
  } catch (error) {
    console.warn('MOVX v29 refinement failed open:', error);
  }
})();
