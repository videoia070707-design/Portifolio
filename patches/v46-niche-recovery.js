/* MOVX v46 — niche recovery runtime
   Owns only the Categories/Territories section. It never moves copy. */
(() => {
  'use strict';
  const root = document.documentElement;
  const grid = document.getElementById('nicheGrid');
  if (!grid) return;

  root.classList.add('movx-v46');
  root.dataset.movxNiche = 'v46-recovered';
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(pointer:fine)').matches;
  const clamp = (v,a=-1,b=1) => Math.min(b,Math.max(a,v));

  const decorate = () => {
    [...grid.querySelectorAll('.niche-card')].forEach((card,index) => {
      card.style.setProperty('--v46-order', String(index));
      if (card.dataset.v46Bound === 'true' || !fine || reduced) return;
      card.dataset.v46Bound = 'true';
      card.addEventListener('pointermove', event => {
        const r = card.getBoundingClientRect();
        const x = clamp(((event.clientX-r.left)/Math.max(1,r.width)-.5)*2);
        const y = clamp(((event.clientY-r.top)/Math.max(1,r.height)-.5)*2);
        card.style.setProperty('--v46-img-x', `${(x*-5.5).toFixed(2)}px`);
        card.style.setProperty('--v46-img-y', `${(y*-4.5).toFixed(2)}px`);
      }, {passive:true});
      card.addEventListener('pointerleave', () => {
        card.style.setProperty('--v46-img-x','0px');
        card.style.setProperty('--v46-img-y','0px');
      }, {passive:true});
    });
  };

  decorate();
  if ('MutationObserver' in window) {
    let raf = 0;
    new MutationObserver(() => {
      if (raf) return;
      raf = requestAnimationFrame(() => { raf = 0; decorate(); });
    }).observe(grid,{childList:true});
  }

  if (reduced || !('IntersectionObserver' in window)) {
    grid.classList.add('v46-ready');
  } else {
    const io = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) {
        grid.classList.add('v46-ready');
        io.disconnect();
      }
    },{threshold:.12,rootMargin:'0px 0px -8% 0px'});
    io.observe(grid);
  }
})();
