/* MOVX v47 — archive flow controller
   Connects Living Archive -> Territories -> Directory without moving copy. */
(() => {
  'use strict';
  const root = document.documentElement;
  const sections = [
    document.getElementById('livingArchive'),
    document.getElementById('nicheIndex'),
    document.getElementById('archiveControls')
  ].filter(Boolean);
  if (!sections.length) return;

  root.classList.add('movx-v47');
  root.dataset.movxArchiveFlow = 'v47-clean-territories';

  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let raf = 0;

  function paint(){
    raf = 0;
    let closest = null;
    let best = Infinity;
    sections.forEach(section => {
      const rect = section.getBoundingClientRect();
      const total = Math.max(1, rect.height + innerHeight);
      const progress = Math.min(1, Math.max(0, (innerHeight - rect.top) / total));
      section.style.setProperty('--v47-flow', progress.toFixed(4));

      const center = rect.top + rect.height * .5;
      const distance = Math.abs(center - innerHeight * .5);
      if (rect.bottom > 0 && rect.top < innerHeight && distance < best) {
        best = distance;
        closest = section;
      }
    });
    sections.forEach(section => section.classList.toggle('v47-flow-current', section === closest));
  }

  function schedule(){
    if (!raf) raf = requestAnimationFrame(paint);
  }

  addEventListener('scroll', schedule, {passive:true});
  addEventListener('resize', schedule, {passive:true});
  if (!reduced) schedule();
  else sections.forEach(section => section.style.setProperty('--v47-flow','1'));
})();
