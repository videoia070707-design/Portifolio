/* MOVX v61 — damped archive flow controller
   Connects Living Archive -> Territories -> Directory with a slower editorial cadence.
   Copy stays fixed; only the existing progress rule is eased. */
(() => {
  'use strict';
  const root = document.documentElement;
  const sections = [
    document.getElementById('livingArchive'),
    document.getElementById('nicheIndex'),
    document.getElementById('archiveControls')
  ].filter(Boolean);
  if (!sections.length) return;

  root.classList.add('movx-v47','movx-v61');
  root.dataset.movxArchiveFlow = 'v61-damped-editorial';

  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const states = new Map(sections.map(section => [section,{value:0,target:0}]));
  let raf = 0;
  let closest = null;

  function measure(){
    let best = Infinity;
    closest = null;
    sections.forEach(section => {
      const rect = section.getBoundingClientRect();
      const total = Math.max(1, rect.height + innerHeight);
      const target = Math.min(1, Math.max(0, (innerHeight - rect.top) / total));
      states.get(section).target = target;

      const center = rect.top + rect.height * .5;
      const distance = Math.abs(center - innerHeight * .5);
      if (rect.bottom > 0 && rect.top < innerHeight && distance < best) {
        best = distance;
        closest = section;
      }
    });
    sections.forEach(section => section.classList.toggle('v47-flow-current', section === closest));
  }

  function paint(){
    raf = 0;
    let unsettled = false;
    sections.forEach(section => {
      const state = states.get(section);
      const delta = state.target - state.value;
      state.value += delta * .085;
      if (Math.abs(delta) > .0007) unsettled = true;
      section.style.setProperty('--v47-flow', state.value.toFixed(4));
    });
    if (unsettled) schedule();
  }

  function schedule(){
    if (!raf) raf = requestAnimationFrame(paint);
  }

  function sync(){
    measure();
    schedule();
  }

  if (reduced) {
    sections.forEach(section => {
      const state=states.get(section);state.value=1;state.target=1;
      section.style.setProperty('--v47-flow','1');
    });
  } else {
    measure();
    sections.forEach(section => { const s=states.get(section);s.value=s.target;section.style.setProperty('--v47-flow',s.value.toFixed(4)); });
    addEventListener('scroll', sync, {passive:true});
    addEventListener('resize', sync, {passive:true});
    document.addEventListener('visibilitychange',()=>{if(!document.hidden)sync();});
  }
})();
