/* MOVX v37 — performance-led editorial archive runtime
   No permanent scroll RAF loops. Motion pauses offscreen and generated archive updates settle as one composition. */
(() => {
  'use strict';

  const root = document.documentElement;
  const reduced = new URLSearchParams(location.search).has('static') || matchMedia('(prefers-reduced-motion: reduce)').matches;
  const wall = document.getElementById('livingArchive');
  const ticker = document.querySelector('.velocity-strip--social');
  const archiveGrid = document.getElementById('archiveGrid');
  const nicheGrid = document.getElementById('nicheGrid');

  root.classList.add('movx-v37');
  root.dataset.movxRuntimeAudit = 'v37-single-motion-owner';

  try {
    /* Pause compositor marquees whenever they cannot contribute to the frame. */
    const motionRegions = [wall, ticker].filter(Boolean);
    const visible = new Map(motionRegions.map(node => [node, true]));

    const applyMotionState = () => {
      motionRegions.forEach(node => {
        const shouldPause = reduced || document.hidden || visible.get(node) === false;
        node.classList.toggle('v37-motion-paused', shouldPause);
      });
    };

    if ('IntersectionObserver' in window && !reduced) {
      const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => visible.set(entry.target, entry.isIntersecting));
        applyMotionState();
      }, { threshold:0, rootMargin:'220px 0px' });
      motionRegions.forEach(node => observer.observe(node));
    }
    document.addEventListener('visibilitychange', applyMotionState, { passive:true });
    applyMotionState();

    /* Filtering rerenders the grid synchronously. Fade the composition as a whole
       instead of starting independent item animations. */
    if (archiveGrid && 'MutationObserver' in window) {
      let settleRaf = 0;
      const settle = () => {
        archiveGrid.classList.add('v37-grid-updating');
        cancelAnimationFrame(settleRaf);
        settleRaf = requestAnimationFrame(() => requestAnimationFrame(() => {
          archiveGrid.classList.remove('v37-grid-updating');
        }));
      };
      new MutationObserver(settle).observe(archiveGrid, { childList:true });
    }

    /* Generated images are already lazy/async. Reinforce low-priority decoding for
       below-the-fold directory artwork without touching the hero/case-study media. */
    const tuneImages = context => {
      context?.querySelectorAll?.('img').forEach((img,index) => {
        if (!img.hasAttribute('decoding')) img.decoding = 'async';
        if (!img.hasAttribute('loading')) img.loading = 'lazy';
        if (context === archiveGrid && index > 1) img.setAttribute('fetchpriority','low');
      });
    };
    tuneImages(nicheGrid);
    tuneImages(archiveGrid);

    if ('MutationObserver' in window) {
      [nicheGrid,archiveGrid].filter(Boolean).forEach(host => {
        let raf = 0;
        new MutationObserver(() => {
          if (raf) return;
          raf = requestAnimationFrame(() => { raf = 0; tuneImages(host); });
        }).observe(host,{ childList:true });
      });
    }

  } catch (error) {
    console.warn('MOVX v37 editorial archive enhancement failed open:', error);
  }
})();
