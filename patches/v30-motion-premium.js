/* MOVX v30 — premium editorial motion
   Native-only, additive, readable by construction. Text does not animate independently of its layout box. */
(() => {
  'use strict';

  const root = document.documentElement;
  const params = new URLSearchParams(location.search);
  const reduced = params.has('static') || matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(pointer:fine)').matches;
  const q = (selector, context = document) => context.querySelector(selector);
  const qa = (selector, context = document) => [...context.querySelectorAll(selector)];
  const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
  const lerp = (a, b, amount) => a + (b - a) * amount;
  const damping = (dt, speed) => 1 - Math.exp(-dt * speed);

  root.classList.add('movx-v28', 'movx-v30');
  root.dataset.movxMotion = 'v30-premium-editorial';

  if (reduced) {
    root.classList.add('movx-reduced-motion');
    return;
  }

  try {
    const heroStage = q('.social-cover-art__stage');
    const heroImage = heroStage && q('.social-cover-art__image', heroStage);
    let heroOverlay = q('.v28-hero-overlay', heroStage || document);

    if (heroStage && heroImage && !heroOverlay && innerWidth > 900) {
      const src = heroImage.currentSrc || heroImage.getAttribute('src');
      heroOverlay = document.createElement('div');
      heroOverlay.className = 'v28-hero-overlay';
      heroOverlay.setAttribute('aria-hidden', 'true');
      heroOverlay.style.setProperty('--v28-hero-image', `url("${src}")`);
      heroOverlay.innerHTML = [
        '<div class="v28-hero-plane v28-hero-plane--type"></div>',
        '<div class="v28-hero-plane v28-hero-plane--crt"></div>',
        '<div class="v28-hero-plane v28-hero-plane--lower"></div>',
        '<div class="v28-hero-grain"></div>'
      ].join('');
      heroImage.insertAdjacentElement('afterend', heroOverlay);
    }

    const about = document.getElementById('about');
    const services = document.getElementById('services');
    const serviceRows = services
      ? qa('.service-row', services).map(row => ({ row, current: .78, target: .78, line: 0, lineTarget: 0 }))
      : [];
    const process = document.getElementById('process');
    const processList = process && q('.process-list', process);
    const processRows = processList
      ? qa('li', processList).map(row => ({ row, current: .76, target: .76, rule: .24, ruleTarget: .24 }))
      : [];
    const contact = document.getElementById('contact');

    const chapters = [
      document.getElementById('livingArchive'),
      document.getElementById('nicheIndex'),
      document.getElementById('archiveControls'),
      q('.projects-list'),
      about,
      services,
      process,
      contact
    ].filter(Boolean).map(section => ({ section, current: 0, target: 0 }));

    chapters.forEach(({ section }) => section.classList.add('v28-chapter'));

    /* Staged reveals: whole layout boxes move together, so copy cannot collide. */
    const revealTargets = [
      ...qa('.service-row'),
      ...qa('.process-list li'),
      ...qa('.about-heading, .about-copy, .about-signature'),
      ...qa('.contact-copy, .contact-form')
    ];

    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('v30-in');
          observer.unobserve(entry.target);
        });
      }, { threshold: .12, rootMargin: '0px 0px -5% 0px' });

      revealTargets.forEach((element, index) => {
        const rect = element.getBoundingClientRect();
        const stagger = Math.min(index % 5, 4) * 55;
        element.style.setProperty('--v30-delay', `${stagger}ms`);
        if (rect.top < innerHeight * .9) {
          element.classList.add('v30-in');
        } else {
          element.classList.add('v30-pending');
          observer.observe(element);
        }
      });
    }

    const target = {
      heroY: 0,
      heroScale: 1.012,
      typeY: 0,
      crtY: 0,
      lowerY: 0,
      pointerX: 0,
      pointerY: 0,
      aboutX: -26,
      aboutY: 34,
      signature: 0,
      contactX: 28,
      contactY: -18,
      contactScale: .975,
      process: 0
    };
    const current = { ...target };

    let raf = 0;
    let dirty = true;
    let lastTime = performance.now();

    const requestFrame = () => {
      dirty = true;
      if (!raf) raf = requestAnimationFrame(frame);
    };

    const setTargets = () => {
      if (heroStage && heroOverlay) {
        const rect = heroStage.getBoundingClientRect();
        const progress = clamp((-rect.top) / Math.max(1, rect.height));
        target.heroY = -progress * 16;
        target.heroScale = 1.012 + progress * .032;
        target.typeY = -progress * 8;
        target.crtY = -progress * 19;
        target.lowerY = -progress * 12;
      }

      if (about) {
        const rect = about.getBoundingClientRect();
        const progress = clamp((innerHeight - rect.top) / Math.max(1, innerHeight + rect.height));
        target.aboutX = lerp(-28, 32, progress);
        target.aboutY = lerp(38, -32, progress);
        target.signature = clamp((progress - .16) / .58) * 100;
      }

      serviceRows.forEach(state => {
        const rect = state.row.getBoundingClientRect();
        const center = rect.top + rect.height / 2;
        const focus = 1 - clamp(Math.abs(center - innerHeight * .56) / (innerHeight * .58));
        state.target = .76 + focus * .24;
        state.lineTarget = 18 + focus * 82;
      });

      if (processList && processRows.length) {
        const listRect = processList.getBoundingClientRect();
        target.process = clamp((innerHeight * .62 - listRect.top) / Math.max(1, listRect.height)) * 100;

        let bestIndex = 0;
        let bestFocus = -1;
        processRows.forEach((state, index) => {
          const rect = state.row.getBoundingClientRect();
          const center = rect.top + rect.height / 2;
          const focus = 1 - clamp(Math.abs(center - innerHeight * .53) / (innerHeight * .56));
          state.target = .72 + focus * .28;
          state.ruleTarget = .24 + focus * .76;
          if (focus > bestFocus) {
            bestFocus = focus;
            bestIndex = index;
          }
        });

        processRows.forEach((state, index) => {
          state.row.classList.toggle('v30-current', index === bestIndex && bestFocus > .16);
        });
      }

      if (contact) {
        const rect = contact.getBoundingClientRect();
        const progress = clamp((innerHeight - rect.top) / Math.max(1, innerHeight + rect.height));
        target.contactX = lerp(26, -22, progress);
        target.contactY = lerp(-18, 26, progress);
        target.contactScale = lerp(.975, 1.025, progress);
      }

      chapters.forEach(state => {
        const rect = state.section.getBoundingClientRect();
        state.target = clamp((innerHeight * .94 - rect.top) / Math.max(160, innerHeight * .52));
      });

      requestFrame();
    };

    const approach = (key, amount, tolerance = .025) => {
      const before = current[key];
      current[key] = lerp(before, target[key], amount);
      return Math.abs(current[key] - target[key]) > tolerance;
    };

    function frame(now) {
      const dt = Math.min(.05, Math.max(.001, (now - lastTime) / 1000));
      lastTime = now;
      raf = 0;

      const medium = damping(dt, 4.15);
      const slow = damping(dt, 2.9);
      let unsettled = dirty;
      dirty = false;

      ['heroY','heroScale','typeY','crtY','lowerY','pointerX','pointerY'].forEach(key => {
        if (approach(key, medium)) unsettled = true;
      });
      ['aboutX','aboutY','signature','contactX','contactY','contactScale','process'].forEach(key => {
        if (approach(key, slow)) unsettled = true;
      });

      if (heroStage && heroOverlay) {
        heroStage.style.setProperty('--v28-hero-x', `${(current.pointerX * .46).toFixed(2)}px`);
        heroStage.style.setProperty('--v28-hero-y', `${(current.heroY + current.pointerY * .22).toFixed(2)}px`);
        heroStage.style.setProperty('--v28-hero-scale', current.heroScale.toFixed(4));
        heroStage.style.setProperty('--v28-type-x', `${(-current.pointerX * .24).toFixed(2)}px`);
        heroStage.style.setProperty('--v28-crt-x', `${(current.pointerX * .48).toFixed(2)}px`);
        heroStage.style.setProperty('--v28-lower-x', `${(current.pointerX * .30).toFixed(2)}px`);
        heroStage.style.setProperty('--v28-type-y', `${(current.typeY - current.pointerY * .12).toFixed(2)}px`);
        heroStage.style.setProperty('--v28-crt-y', `${(current.crtY + current.pointerY * .27).toFixed(2)}px`);
        heroStage.style.setProperty('--v28-lower-y', `${(current.lowerY + current.pointerY * .17).toFixed(2)}px`);
      }

      if (about) {
        about.style.setProperty('--v28-about-x', `${current.aboutX.toFixed(2)}px`);
        about.style.setProperty('--v28-about-y', `${current.aboutY.toFixed(2)}px`);
        about.style.setProperty('--v28-signature', `${current.signature.toFixed(1)}%`);
      }

      serviceRows.forEach(state => {
        state.current = lerp(state.current, state.target, slow);
        state.line = lerp(state.line, state.lineTarget, slow);
        state.row.style.setProperty('--v30-service-opacity', state.current.toFixed(3));
        state.row.style.setProperty('--v28-service-line', `${state.line.toFixed(1)}%`);
        if (Math.abs(state.current - state.target) > .006 || Math.abs(state.line - state.lineTarget) > .12) unsettled = true;
      });

      if (processList) {
        processList.style.setProperty('--v28-process', `${current.process.toFixed(2)}%`);
        processRows.forEach(state => {
          state.current = lerp(state.current, state.target, slow);
          state.rule = lerp(state.rule, state.ruleTarget, slow);
          state.row.style.setProperty('--v30-process-opacity', state.current.toFixed(3));
          state.row.style.setProperty('--v30-process-rule', state.rule.toFixed(3));
          if (Math.abs(state.current - state.target) > .006 || Math.abs(state.rule - state.ruleTarget) > .006) unsettled = true;
        });
      }

      if (contact) {
        contact.style.setProperty('--v28-contact-x', `${current.contactX.toFixed(1)}px`);
        contact.style.setProperty('--v28-contact-y', `${current.contactY.toFixed(1)}px`);
        contact.style.setProperty('--v28-contact-scale', current.contactScale.toFixed(4));
      }

      chapters.forEach(state => {
        state.current = lerp(state.current, state.target, slow);
        state.section.style.setProperty('--v28-rule', state.current.toFixed(4));
        if (Math.abs(state.current - state.target) > .006) unsettled = true;
      });

      if (unsettled && !raf) raf = requestAnimationFrame(frame);
    }

    if (heroStage && finePointer) {
      heroStage.addEventListener('pointermove', event => {
        const rect = heroStage.getBoundingClientRect();
        target.pointerX = (clamp((event.clientX - rect.left) / Math.max(1, rect.width)) - .5) * 9;
        target.pointerY = (clamp((event.clientY - rect.top) / Math.max(1, rect.height)) - .5) * 7;
        requestFrame();
      }, { passive: true });

      heroStage.addEventListener('pointerleave', () => {
        target.pointerX = 0;
        target.pointerY = 0;
        requestFrame();
      }, { passive: true });
    }

    addEventListener('scroll', setTargets, { passive: true });
    addEventListener('resize', setTargets, { passive: true });
    addEventListener('load', setTargets, { once: true });
    setTargets();

    const themeToggle = q('[data-theme-toggle]');
    themeToggle?.addEventListener('click', () => {
      themeToggle.classList.remove('v30-theme-pop');
      void themeToggle.offsetWidth;
      themeToggle.classList.add('v30-theme-pop');
      setTimeout(() => themeToggle.classList.remove('v30-theme-pop'), 720);
    });
  } catch (error) {
    console.warn('MOVX v30 motion failed open:', error);
  }
})();
