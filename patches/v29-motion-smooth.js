/* MOVX v29 — inertial editorial motion
   Native-only, additive and fail-open. Continuous effects are damped in rAF. */
(() => {
  'use strict';

  const root = document.documentElement;
  const params = new URLSearchParams(location.search);
  const reduced = params.has('static') || matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(pointer:fine)').matches;
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const damping = (dt, speed) => 1 - Math.exp(-dt * speed);
  const q = (s, c = document) => c.querySelector(s);
  const qa = (s, c = document) => [...c.querySelectorAll(s)];

  root.classList.add('movx-v28', 'movx-v29');
  root.dataset.movxMotion = 'v29-inertial';
  if (reduced) return;

  try {
    const heroStage = q('.social-cover-art__stage');
    const heroImage = heroStage && q('.social-cover-art__image', heroStage);
    let heroOverlay = null;

    if (heroStage && heroImage && innerWidth > 900) {
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
    const serviceRows = services ? qa('.service-row', services).map(row => ({ row, current: .62, target: .62, line: 0, lineTarget: 0 })) : [];
    const process = document.getElementById('process');
    const processList = process && q('.process-list', process);
    const processRows = processList ? qa('li', processList).map(row => ({ row, current: .48, target: .48, rule: .28, ruleTarget: .28 })) : [];
    const contact = document.getElementById('contact');
    const chapters = [
      document.getElementById('livingArchive'),
      document.getElementById('nicheIndex'),
      document.getElementById('archiveControls'),
      q('.projects-list'),
      about, services, process, contact
    ].filter(Boolean).map(section => ({ section, current: 0, target: 0 }));
    chapters.forEach(({ section }) => section.classList.add('v28-chapter'));

    const target = {
      heroY: 0, heroScale: 1.018, typeY: 0, crtY: 0, lowerY: 0,
      pointerX: 0, pointerY: 0,
      aboutX: -46, aboutY: 64, signature: 0,
      contactX: 48, contactY: -28, contactScale: .94,
      process: 0
    };
    const current = { ...target };

    let pointerX = 0;
    let pointerY = 0;
    let raf = 0;
    let lastTime = performance.now();
    let dirty = true;
    let lastScrollY = scrollY;
    let scrollVelocity = 0;

    const setTargets = () => {
      dirty = true;
      const y = scrollY;
      scrollVelocity = lerp(scrollVelocity, y - lastScrollY, .28);
      lastScrollY = y;

      if (heroStage && heroOverlay) {
        const rect = heroStage.getBoundingClientRect();
        const p = clamp((-rect.top) / Math.max(1, rect.height));
        target.heroY = -p * 22;
        target.heroScale = 1.018 + p * .052;
        target.typeY = -p * 11;
        target.crtY = -p * 29;
        target.lowerY = -p * 18;
      }

      if (about) {
        const rect = about.getBoundingClientRect();
        const p = clamp((innerHeight - rect.top) / Math.max(1, innerHeight + rect.height));
        target.aboutX = lerp(-52, 58, p);
        target.aboutY = lerp(72, -62, p);
        target.signature = clamp((p - .16) / .58) * 100;
      }

      serviceRows.forEach(state => {
        const rect = state.row.getBoundingClientRect();
        const center = rect.top + rect.height / 2;
        const focus = 1 - clamp(Math.abs(center - innerHeight * .56) / (innerHeight * .54));
        state.target = .48 + focus * .52;
        state.lineTarget = focus * 100;
      });

      if (processList) {
        const rect = processList.getBoundingClientRect();
        target.process = clamp((innerHeight * .58 - rect.top) / Math.max(1, rect.height)) * 100;
        let bestIndex = -1;
        let bestFocus = -1;
        processRows.forEach((state, index) => {
          const r = state.row.getBoundingClientRect();
          const center = r.top + r.height / 2;
          const focus = 1 - clamp(Math.abs(center - innerHeight * .55) / (innerHeight * .50));
          state.target = .36 + focus * .64;
          state.ruleTarget = .28 + focus * .72;
          if (focus > bestFocus) { bestFocus = focus; bestIndex = index; }
        });
        processRows.forEach((state, index) => {
          state.row.classList.toggle('v29-current', index === bestIndex && bestFocus > .24);
        });
      }

      if (contact) {
        const rect = contact.getBoundingClientRect();
        const p = clamp((innerHeight - rect.top) / Math.max(1, innerHeight + rect.height));
        target.contactX = lerp(44, -34, p);
        target.contactY = lerp(-30, 40, p);
        target.contactScale = lerp(.945, 1.052, p);
      }

      chapters.forEach(state => {
        const rect = state.section.getBoundingClientRect();
        state.target = clamp((innerHeight * .93 - rect.top) / Math.max(160, innerHeight * .46));
      });

      if (!raf) raf = requestAnimationFrame(frame);
    };

    const frame = now => {
      const dt = Math.min(.05, Math.max(.001, (now - lastTime) / 1000));
      lastTime = now;
      raf = 0;
      const smooth = damping(dt, 6.2);
      const slow = damping(dt, 4.8);
      let unsettled = dirty;
      dirty = false;

      const approach = (key, speed = smooth) => {
        const before = current[key];
        current[key] = lerp(before, target[key], speed);
        if (Math.abs(current[key] - target[key]) > .035) unsettled = true;
      };

      ['heroY','heroScale','typeY','crtY','lowerY','pointerX','pointerY'].forEach(key => approach(key, smooth));
      ['aboutX','aboutY','signature','contactX','contactY','contactScale','process'].forEach(key => approach(key, slow));

      if (heroStage && heroOverlay) {
        heroStage.style.setProperty('--v28-hero-x', `${(current.pointerX * .5).toFixed(2)}px`);
        heroStage.style.setProperty('--v28-hero-y', `${(current.heroY + current.pointerY * .28).toFixed(2)}px`);
        heroStage.style.setProperty('--v28-hero-scale', current.heroScale.toFixed(4));
        heroStage.style.setProperty('--v28-type-x', `${(-current.pointerX * .35).toFixed(2)}px`);
        heroStage.style.setProperty('--v28-crt-x', `${(current.pointerX * .72).toFixed(2)}px`);
        heroStage.style.setProperty('--v28-lower-x', `${(current.pointerX * .42).toFixed(2)}px`);
        heroStage.style.setProperty('--v28-type-y', `${(current.typeY - current.pointerY * .18).toFixed(2)}px`);
        heroStage.style.setProperty('--v28-crt-y', `${(current.crtY + current.pointerY * .44).toFixed(2)}px`);
        heroStage.style.setProperty('--v28-lower-y', `${(current.lowerY + current.pointerY * .26).toFixed(2)}px`);
      }

      if (about) {
        about.style.setProperty('--v28-about-x', `${current.aboutX.toFixed(2)}px`);
        about.style.setProperty('--v28-about-y', `${current.aboutY.toFixed(2)}px`);
        about.style.setProperty('--v28-signature', `${current.signature.toFixed(1)}%`);
      }

      serviceRows.forEach(state => {
        state.current = lerp(state.current, state.target, slow);
        state.line = lerp(state.line, state.lineTarget, slow);
        state.row.style.setProperty('--v29-service-opacity', state.current.toFixed(3));
        state.row.style.setProperty('--v28-service-line', `${state.line.toFixed(1)}%`);
        if (Math.abs(state.current - state.target) > .01 || Math.abs(state.line - state.lineTarget) > .2) unsettled = true;
      });

      if (processList) {
        processList.style.setProperty('--v28-process', `${current.process.toFixed(2)}%`);
        processRows.forEach(state => {
          state.current = lerp(state.current, state.target, slow);
          state.rule = lerp(state.rule, state.ruleTarget, slow);
          state.row.style.setProperty('--v29-process-opacity', state.current.toFixed(3));
          state.row.style.setProperty('--v29-process-rule', state.rule.toFixed(3));
          if (Math.abs(state.current - state.target) > .01 || Math.abs(state.rule - state.ruleTarget) > .01) unsettled = true;
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
        if (Math.abs(state.current - state.target) > .01) unsettled = true;
      });

      scrollVelocity *= Math.pow(.82, dt * 60);
      if (Math.abs(scrollVelocity) > .08) unsettled = true;
      if (unsettled && !raf) raf = requestAnimationFrame(frame);
    };

    if (heroStage && finePointer) {
      heroStage.addEventListener('pointermove', event => {
        const rect = heroStage.getBoundingClientRect();
        pointerX = (clamp((event.clientX - rect.left) / Math.max(1, rect.width)) - .5) * 16;
        pointerY = (clamp((event.clientY - rect.top) / Math.max(1, rect.height)) - .5) * 12;
        target.pointerX = pointerX;
        target.pointerY = pointerY;
        dirty = true;
        if (!raf) raf = requestAnimationFrame(frame);
      }, { passive: true });
      heroStage.addEventListener('pointerleave', () => {
        target.pointerX = 0;
        target.pointerY = 0;
        dirty = true;
        if (!raf) raf = requestAnimationFrame(frame);
      }, { passive: true });
    }

    addEventListener('scroll', setTargets, { passive: true });
    addEventListener('resize', setTargets, { passive: true });
    addEventListener('load', setTargets, { once: true });
    setTargets();

    const themeToggle = q('[data-theme-toggle]');
    themeToggle?.addEventListener('click', () => {
      themeToggle.classList.remove('v28-theme-pop');
      void themeToggle.offsetWidth;
      themeToggle.classList.add('v28-theme-pop');
      setTimeout(() => themeToggle.classList.remove('v28-theme-pop'), 560);
    });
  } catch (error) {
    console.warn('MOVX v29 motion failed open:', error);
  }
})();
