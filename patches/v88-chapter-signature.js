/* MOVX v88 — chapter continuity runtime
   One rAF loop owns first-half chapter state. It drives only CSS custom properties,
   a restrained editorial fold mark and local media translation. Copy is never transformed. */
(() => {
  'use strict';

  const root = document.documentElement;
  const reduced = new URLSearchParams(location.search).has('static') || matchMedia('(prefers-reduced-motion: reduce)').matches;
  const desktop = matchMedia('(min-width:981px)').matches;
  const fine = matchMedia('(pointer:fine)').matches;
  const clamp = (v,a=0,b=1) => Math.min(b,Math.max(a,v));
  const lerp = (a,b,t) => a + (b-a)*t;

  const chapters = [
    { key:'hero', node:document.getElementById('heroTop') },
    { key:'archive', node:document.getElementById('livingArchive') },
    { key:'territories', node:document.getElementById('nicheIndex') },
    { key:'directory', node:document.getElementById('archiveControls') },
    { key:'projects', node:document.querySelector('.projects-list') }
  ].filter(item => item.node);
  if (!chapters.length) return;

  root.classList.add('movx-v88');
  root.dataset.movxChapterSignature = 'v88-fold-continuity-single-owner';

  const markHTML = '<i class="v88-fold-mark__rail"></i><i class="v88-fold-mark__plane"></i>';
  const markHosts = chapters.filter(item => ['archive','territories'].includes(item.key));
  markHosts.forEach(({node,key}) => {
    if (node.querySelector(':scope > .v88-fold-mark')) return;
    const mark = document.createElement('span');
    mark.className = 'v88-fold-mark';
    mark.dataset.v88Chapter = key;
    mark.setAttribute('aria-hidden','true');
    mark.innerHTML = markHTML;
    node.appendChild(mark);
  });

  let raf = 0;
  let current = null;

  function writeChapter(item, rect){
    const node = item.node;
    const travel = Math.max(1,rect.height + innerHeight);
    const progress = clamp((innerHeight - rect.top) / travel);
    const center = rect.top + rect.height * .5;
    const focusDistance = Math.abs(center - innerHeight * .5);
    const focus = clamp(1 - focusDistance / Math.max(innerHeight * .92, rect.height * .58));
    const enter = clamp((innerHeight * .9 - rect.top) / Math.max(1,innerHeight * .72));
    const angle = lerp(20,-14,progress);
    const lift = lerp(7,0,focus);

    node.style.setProperty('--v88-progress',progress.toFixed(4));
    node.style.setProperty('--v88-focus',focus.toFixed(4));
    node.style.setProperty('--v88-fold-angle',`${angle.toFixed(2)}deg`);
    node.style.setProperty('--v88-fold-lift',`${lift.toFixed(2)}px`);

    const mark = node.querySelector(':scope > .v88-fold-mark');
    if (mark) {
      mark.style.setProperty('--v88-fold-angle',`${angle.toFixed(2)}deg`);
      mark.style.setProperty('--v88-fold-lift',`${lift.toFixed(2)}px`);
      mark.style.setProperty('--v88-fold-opacity',(0.20 + focus*.42).toFixed(3));
    }

    if (item.key === 'archive') {
      const rows = [...node.querySelectorAll('.loop-row')];
      const offsets = [-26,18,-14];
      rows.forEach((row,index) => {
        const shift = (offsets[index] ?? ((index%2?-1:1)*12)) * (1-enter);
        row.style.setProperty('--v88-row-x',`${shift.toFixed(2)}px`);
      });
    }
  }

  function measure(){
    raf = 0;
    let best = Infinity;
    let nextCurrent = null;

    chapters.forEach(item => {
      const rect = item.node.getBoundingClientRect();
      writeChapter(item,rect);
      if (rect.bottom <= 0 || rect.top >= innerHeight) return;
      const center = rect.top + rect.height*.5;
      const distance = Math.abs(center - innerHeight*.5);
      if (distance < best) { best = distance; nextCurrent = item; }
    });

    if (nextCurrent !== current) {
      current = nextCurrent;
      chapters.forEach(item => item.node.classList.toggle('v88-chapter-current',item === current));
      if (current) root.dataset.movxCurrentChapter = current.key;
    }
  }

  function schedule(){
    if (!raf && !document.hidden) raf = requestAnimationFrame(measure);
  }

  /* Local depth is restricted to territory photography. Project covers keep the
     established v86/v87 motion owner so selected cases never have competing input. */
  const bound = new WeakSet();
  function bindMedia(){
    if (!desktop || !fine || reduced) return;

    document.querySelectorAll('#nicheGrid .niche-card').forEach(card => {
      if (bound.has(card)) return;
      bound.add(card);
      const media = card.querySelector('.niche-card__media');
      if (!media) return;
      card.addEventListener('pointermove',event => {
        const rect = card.getBoundingClientRect();
        const x = clamp((event.clientX-rect.left)/Math.max(1,rect.width),0,1)-.5;
        const y = clamp((event.clientY-rect.top)/Math.max(1,rect.height),0,1)-.5;
        media.style.setProperty('--v88-media-x',`${(x*6).toFixed(2)}px`);
        media.style.setProperty('--v88-media-y',`${(y*4).toFixed(2)}px`);
      },{passive:true});
      card.addEventListener('pointerleave',() => {
        media.style.setProperty('--v88-media-x','0px');
        media.style.setProperty('--v88-media-y','0px');
      },{passive:true});
    });
  }

  if (reduced) {
    chapters.forEach(item => {
      item.node.style.setProperty('--v88-progress','1');
      item.node.style.setProperty('--v88-focus','1');
      item.node.style.setProperty('--v88-fold-angle','0deg');
      item.node.style.setProperty('--v88-fold-lift','0px');
    });
  } else {
    measure();
    addEventListener('scroll',schedule,{passive:true});
    addEventListener('resize',schedule,{passive:true});
    document.addEventListener('visibilitychange',()=>{if(!document.hidden)schedule();});
  }

  bindMedia();
  const dynamicHost = document.getElementById('nicheGrid');
  if (dynamicHost && 'MutationObserver' in window) {
    new MutationObserver(() => { bindMedia(); schedule(); }).observe(dynamicHost,{childList:true,subtree:true});
  }
})();
