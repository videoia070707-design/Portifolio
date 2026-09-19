/* MOVX v21 — resilient motion engine
   Keeps the portfolio animated even when legacy animation rules conflict.
   Use ?static=1 to explicitly disable this layer. */
(() => {
  'use strict';
  const params = new URLSearchParams(location.search);
  if (params.has('static')) return;

  document.documentElement.classList.add('movx-motion-v21');

  const ease = 'cubic-bezier(.2,.75,.18,1)';

  /* ---------------------------------------------------------
     3-row artwork conveyor — single source of motion truth
     --------------------------------------------------------- */
  const wall = document.getElementById('loopWall');
  if (wall) {
    let rowStates = [];
    let hoveredRow = null;
    let last = performance.now();
    let enhanceTimer = 0;

    const measure = state => {
      const cards = [...state.track.children];
      const half = Math.floor(cards.length / 2);
      let distance = 0;
      if (half > 0 && cards[half] && cards[0]) {
        distance = cards[half].offsetLeft - cards[0].offsetLeft;
      }
      if (!distance || distance < 10) distance = state.track.scrollWidth / 2;
      state.distance = Math.max(1, distance);
      if (!state.initialized) {
        state.x = state.direction > 0 ? -state.distance : -(state.index * 0.13 * state.distance);
        while (state.x <= -state.distance) state.x += state.distance;
        state.initialized = true;
      } else {
        while (state.x <= -state.distance) state.x += state.distance;
        while (state.x > 0) state.x -= state.distance;
      }
    };

    const enhanceWall = () => {
      const rows = [...wall.querySelectorAll(':scope > .loop-row')];
      if (!rows.length) return;

      rowStates = rows.map((row, index) => {
        const track = row.querySelector('.loop-track');
        if (!track) return null;

        let stage = track.parentElement;
        if (!stage?.classList.contains('movx-conveyor-stage')) {
          stage = document.createElement('div');
          stage.className = 'movx-conveyor-stage';
          track.before(stage);
          stage.appendChild(track);
        }

        const priorX = Number(stage.dataset.motionX);
        const state = {
          row,
          track,
          stage,
          index,
          direction: index % 2 === 1 ? 1 : -1,
          speed: [74, 61, 68][index % 3],
          x: Number.isFinite(priorX) ? priorX : 0,
          distance: 1,
          initialized: stage.dataset.motionReady === '1'
        };
        measure(state);
        stage.dataset.motionReady = '1';
        return state;
      }).filter(Boolean);

      wall.dataset.motionEngine = 'v21';
    };

    const scheduleEnhance = () => {
      clearTimeout(enhanceTimer);
      enhanceTimer = setTimeout(() => {
        enhanceWall();
        requestAnimationFrame(() => rowStates.forEach(measure));
      }, 30);
    };

    wall.addEventListener('pointerover', event => {
      const card = event.target.closest('.loop-card');
      if (card && wall.contains(card)) hoveredRow = card.closest('.loop-row');
    });
    wall.addEventListener('pointerout', event => {
      const row = event.target.closest?.('.loop-row');
      if (row && hoveredRow === row && !row.contains(event.relatedTarget)) hoveredRow = null;
    });
    wall.addEventListener('load', scheduleEnhance, true);

    new MutationObserver(scheduleEnhance).observe(wall, { childList: true });
    window.addEventListener('resize', scheduleEnhance, { passive: true });
    document.addEventListener('visibilitychange', () => { last = performance.now(); });

    const frame = now => {
      const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
      last = now;
      for (const state of rowStates) {
        if (!state.stage.isConnected || !state.distance) continue;
        if (state.row !== hoveredRow) {
          state.x += state.direction * state.speed * dt;
          if (state.direction < 0 && state.x <= -state.distance) state.x += state.distance;
          if (state.direction > 0 && state.x >= 0) state.x -= state.distance;
          state.stage.dataset.motionX = String(state.x);
          state.stage.style.transform = `translate3d(${state.x.toFixed(2)}px,0,0)`;
        }
      }
      requestAnimationFrame(frame);
    };

    enhanceWall();
    setTimeout(scheduleEnhance, 450);
    requestAnimationFrame(frame);
  }

  /* ---------------------------------------------------------
     Editorial velocity strip — guaranteed continuous motion
     --------------------------------------------------------- */
  const ticker = document.querySelector('.velocity-track');
  if (ticker) {
    let stage = ticker.parentElement;
    if (!stage?.classList.contains('movx-ticker-stage')) {
      stage = document.createElement('div');
      stage.className = 'movx-ticker-stage';
      ticker.before(stage);
      stage.appendChild(ticker);
    }
    let x = 0;
    let lastTicker = performance.now();
    const tick = now => {
      const dt = Math.min(0.05, (now - lastTicker) / 1000);
      lastTicker = now;
      const half = Math.max(1, ticker.scrollWidth / 2);
      x -= 26 * dt;
      if (x <= -half) x += half;
      stage.style.transform = `translate3d(${x.toFixed(2)}px,0,0)`;
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  /* ---------------------------------------------------------
     Viewport motion — explicit WAAPI fallback for sections
     --------------------------------------------------------- */
  const motionSelector = [
    '.archive-head', '.niche-card', '.archive-card', '.project-entry',
    '.selected-index-row', '.about-section .about-grid > *', '.service-row',
    '.process-step', '.contact-section .contact-copy', '.contact-section .contact-form'
  ].join(',');

  const animateIn = (el, index = 0) => {
    if (el.dataset.movxEntered === '1') return;
    el.dataset.movxEntered = '1';
    el.animate([
      { opacity: 0, transform: 'translate3d(0,26px,0)' },
      { opacity: 1, transform: 'translate3d(0,0,0)' }
    ], {
      duration: 620,
      delay: Math.min(index * 38, 190),
      easing: ease,
      fill: 'both'
    });
  };

  let revealObserver;
  const registerMotion = (scope = document) => {
    const nodes = [...scope.querySelectorAll(motionSelector)].filter(el => el.dataset.movxObserved !== '1');
    nodes.forEach((el, index) => {
      el.dataset.movxObserved = '1';
      revealObserver?.observe(el);
      if (!revealObserver) animateIn(el, index);
    });
  };

  if ('IntersectionObserver' in window) {
    revealObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animateIn(entry.target);
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -4% 0px' });
  }
  registerMotion();

  ['archiveGrid', 'projectsList', 'nicheGrid'].forEach(id => {
    const target = document.getElementById(id);
    if (target) new MutationObserver(() => registerMotion(target)).observe(target, { childList: true, subtree: true });
  });

  /* Media reveal for dynamically rendered project imagery. */
  const mediaObserver = 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting || entry.target.dataset.movxMediaIn === '1') return;
      entry.target.dataset.movxMediaIn = '1';
      entry.target.animate([
        { opacity: .35, transform: 'scale(1.035)' },
        { opacity: 1, transform: 'scale(1)' }
      ], { duration: 780, easing: ease, fill: 'both' });
      mediaObserver.unobserve(entry.target);
    });
  }, { threshold: .12 }) : null;

  const registerMedia = (scope = document) => {
    scope.querySelectorAll('.archive-card img,.project-cover img,.niche-card img').forEach(img => {
      if (img.dataset.movxMediaObserved === '1') return;
      img.dataset.movxMediaObserved = '1';
      if (mediaObserver) mediaObserver.observe(img);
    });
  };
  registerMedia();
  ['archiveGrid', 'projectsList', 'nicheGrid'].forEach(id => {
    const target = document.getElementById(id);
    if (target) new MutationObserver(() => registerMedia(target)).observe(target, { childList: true, subtree: true });
  });

  /* Case viewer entrance gets a reliable editorial transition. */
  const viewer = document.getElementById('caseViewer');
  if (viewer) {
    new MutationObserver(() => {
      if (!viewer.classList.contains('open')) return;
      requestAnimationFrame(() => {
        viewer.querySelector('.case-hero__media img')?.animate([
          { opacity: .45, transform: 'scale(1.045)' },
          { opacity: 1, transform: 'scale(1)' }
        ], { duration: 900, easing: ease, fill: 'both' });
        viewer.querySelectorAll('.case-study-block,.case-chapter-label,.case-study-note').forEach((el, index) => {
          el.animate([
            { opacity: 0, transform: 'translateY(18px)' },
            { opacity: 1, transform: 'translateY(0)' }
          ], { duration: 520, delay: Math.min(index * 30, 240), easing: ease, fill: 'both' });
        });
      });
    }).observe(viewer, { attributes: true, attributeFilter: ['class'] });
  }
})();
