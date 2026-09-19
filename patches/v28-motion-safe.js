/* MOVX v28 — safe premium motion layer
   Native browser APIs only. Additive, fail-open and independent of content rendering. */
(() => {
  'use strict';

  const root = document.documentElement;
  const params = new URLSearchParams(location.search);
  const reduceMotion = params.has('static') || matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(pointer:fine)').matches;
  const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
  const lerp = (a, b, t) => a + (b - a) * t;

  root.classList.add('movx-v28');
  root.dataset.movxMotion = 'v28-safe';

  if (reduceMotion) {
    root.classList.add('movx-v28-reduced');
    return;
  }

  try {
    const heroStage = document.querySelector('.social-cover-art__stage');
    const heroImage = heroStage?.querySelector('.social-cover-art__image');
    let heroOverlay = null;

    if (heroStage && heroImage && finePointer && innerWidth > 900) {
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

      let pointerX = 0;
      let pointerY = 0;
      let pointerTargetX = 0;
      let pointerTargetY = 0;
      let pointerFrame = 0;

      const settlePointer = () => {
        pointerX = lerp(pointerX, pointerTargetX, .105);
        pointerY = lerp(pointerY, pointerTargetY, .105);
        heroStage.style.setProperty('--v28-hero-x', `${pointerX.toFixed(2)}px`);
        heroStage.style.setProperty('--v28-type-x', `${(-pointerX * .34).toFixed(2)}px`);
        heroStage.style.setProperty('--v28-crt-x', `${(pointerX * .62).toFixed(2)}px`);
        heroStage.style.setProperty('--v28-lower-x', `${(pointerX * .38).toFixed(2)}px`);
        if (Math.abs(pointerX - pointerTargetX) > .08 || Math.abs(pointerY - pointerTargetY) > .08) {
          pointerFrame = requestAnimationFrame(settlePointer);
        } else {
          pointerFrame = 0;
        }
      };

      const requestPointerFrame = () => {
        if (!pointerFrame) pointerFrame = requestAnimationFrame(settlePointer);
      };

      heroStage.addEventListener('pointermove', event => {
        const rect = heroStage.getBoundingClientRect();
        const nx = clamp((event.clientX - rect.left) / Math.max(1, rect.width), 0, 1) - .5;
        const ny = clamp((event.clientY - rect.top) / Math.max(1, rect.height), 0, 1) - .5;
        pointerTargetX = nx * 14;
        pointerTargetY = ny * 10;
        requestPointerFrame();
      }, { passive: true });

      heroStage.addEventListener('pointerleave', () => {
        pointerTargetX = 0;
        pointerTargetY = 0;
        requestPointerFrame();
      }, { passive: true });
    }

    const about = document.getElementById('about');
    const services = document.getElementById('services');
    const serviceRows = services ? [...services.querySelectorAll('.service-row')] : [];
    const process = document.getElementById('process');
    const processList = process?.querySelector('.process-list');
    const processSteps = processList ? [...processList.querySelectorAll('li')] : [];
    const contact = document.getElementById('contact');
    const wall = document.getElementById('loopWall');
    const chapters = [
      document.getElementById('livingArchive'),
      document.getElementById('nicheIndex'),
      document.getElementById('archiveControls'),
      document.querySelector('.projects-list'),
      about, services, process, contact
    ].filter(Boolean);

    chapters.forEach(section => section.classList.add('v28-chapter'));

    let lastY = scrollY;
    let velocity = 0;
    let raf = 0;

    const sectionProgress = rect => clamp((innerHeight - rect.top) / Math.max(1, innerHeight + rect.height));

    const update = () => {
      raf = 0;
      const y = scrollY;
      const delta = y - lastY;
      lastY = y;
      velocity = lerp(velocity, delta, .32);
      const absVelocity = Math.abs(velocity);

      root.style.setProperty('--v28-scroll-velocity', absVelocity.toFixed(2));
      if (wall) wall.dataset.v28Fast = absVelocity > 18 ? '1' : '0';

      if (heroStage && heroOverlay) {
        const rect = heroStage.getBoundingClientRect();
        if (rect.bottom > 0 && rect.top < innerHeight) {
          const p = clamp((-rect.top) / Math.max(1, rect.height));
          heroStage.style.setProperty('--v28-hero-y', `${(-p * 18).toFixed(2)}px`);
          heroStage.style.setProperty('--v28-hero-scale', (1.018 + p * .045).toFixed(4));
          heroStage.style.setProperty('--v28-type-y', `${(-p * 12).toFixed(2)}px`);
          heroStage.style.setProperty('--v28-crt-y', `${(-p * 26).toFixed(2)}px`);
          heroStage.style.setProperty('--v28-lower-y', `${(-p * 17).toFixed(2)}px`);
        }
      }

      if (about) {
        const rect = about.getBoundingClientRect();
        if (rect.bottom > -100 && rect.top < innerHeight + 100) {
          const p = sectionProgress(rect);
          about.style.setProperty('--v28-about-x', `${lerp(-46, 52, p).toFixed(2)}px`);
          about.style.setProperty('--v28-about-y', `${lerp(64, -54, p).toFixed(2)}px`);
          about.style.setProperty('--v28-signature', `${(clamp((p - .18) / .55) * 100).toFixed(1)}%`);
        }
      }

      serviceRows.forEach(row => {
        const rect = row.getBoundingClientRect();
        if (rect.bottom < -80 || rect.top > innerHeight + 80) return;
        const center = rect.top + rect.height / 2;
        const focus = 1 - clamp(Math.abs(center - innerHeight * .54) / (innerHeight * .52));
        row.style.setProperty('--v28-service-line', `${(focus * 100).toFixed(1)}%`);
        row.style.setProperty('--v28-service-x', `${(focus * 14).toFixed(2)}px`);
      });

      if (process && processList) {
        const rect = processList.getBoundingClientRect();
        const p = clamp((innerHeight * .58 - rect.top) / Math.max(1, rect.height));
        processList.style.setProperty('--v28-process', `${(p * 100).toFixed(2)}%`);

        let current = -1;
        processSteps.forEach((step, index) => {
          const stepRect = step.getBoundingClientRect();
          if (stepRect.top < innerHeight * .60) current = index;
        });
        processSteps.forEach((step, index) => {
          step.classList.toggle('v28-past', index < current);
          step.classList.toggle('v28-current', index === current);
        });
      }

      if (contact) {
        const rect = contact.getBoundingClientRect();
        if (rect.bottom > 0 && rect.top < innerHeight) {
          const p = sectionProgress(rect);
          contact.style.setProperty('--v28-contact-x', `${lerp(48, -30, p).toFixed(1)}px`);
          contact.style.setProperty('--v28-contact-y', `${lerp(-28, 38, p).toFixed(1)}px`);
          contact.style.setProperty('--v28-contact-scale', lerp(.94, 1.055, p).toFixed(4));
        }
      }

      chapters.forEach(section => {
        const rect = section.getBoundingClientRect();
        const p = clamp((innerHeight * .94 - rect.top) / Math.max(120, innerHeight * .42));
        section.style.setProperty('--v28-rule', p.toFixed(4));
      });
    };

    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };

    addEventListener('scroll', schedule, { passive: true });
    addEventListener('resize', schedule, { passive: true });
    addEventListener('load', schedule, { once: true });
    schedule();

    const themeToggle = document.querySelector('[data-theme-toggle]');
    themeToggle?.addEventListener('click', () => {
      themeToggle.classList.remove('v28-theme-pop');
      void themeToggle.offsetWidth;
      themeToggle.classList.add('v28-theme-pop');
      setTimeout(() => themeToggle.classList.remove('v28-theme-pop'), 560);
    });

    if (wall) {
      wall.addEventListener('pointerover', event => {
        const card = event.target.closest('.loop-card');
        if (!card || !wall.contains(card)) return;
        const row = card.closest('.loop-row');
        row?.classList.add('v28-focus-row');
      });
      wall.addEventListener('pointerout', event => {
        const row = event.target.closest?.('.loop-row');
        if (row && !row.contains(event.relatedTarget)) row.classList.remove('v28-focus-row');
      });
    }
  } catch (error) {
    console.warn('MOVX v28 motion enhancement failed open:', error);
  }
})();
