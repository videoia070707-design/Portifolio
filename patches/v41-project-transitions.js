/* MOVX v86 — shared artwork project transition
   Reuses the reliable v41 opener snapshot, but removes the generic shader language.
   The clicked artwork itself becomes the navigation: cover -> case hero -> cover.
   Copy remains planar; the transition is a single media gesture with an authored
   open-corner registration mark shared by the list and the case study. */
(() => {
  'use strict';

  const root = document.documentElement;
  const compact = matchMedia('(max-width:980px)').matches;
  const reduced = new URLSearchParams(location.search).has('static') || matchMedia('(prefers-reduced-motion: reduce)').matches || compact;
  const section = document.querySelector('.projects-list');
  const list = document.getElementById('projectsList');
  const viewer = document.getElementById('caseViewer');
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));

  root.classList.add('movx-v41','movx-v86');
  root.dataset.movxProjectPortal = 'v86-shared-artwork';
  root.dataset.movxSignatureMotion = 'v86';

  /* v86 must be the final visual owner. The build packages this stylesheet,
     and the existing v41 runtime appends it after all legacy CSS. */
  if (!document.querySelector('link[data-movx-v86-signature]')) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'v86-signature-motion.css?v=86-signature-motion';
    link.dataset.movxV86Signature = 'true';
    document.head.appendChild(link);
  }

  if (!viewer) return;

  /* --------------------------------------------------------------
     1) Project mood stays contextual but intentionally quiet.
     -------------------------------------------------------------- */
  let moodRaf = 0;
  const syncMood = () => {
    moodRaf = 0;
    const current = list?.querySelector('.project-entry.v39-depth-current') || list?.querySelector('.project-entry');
    if (!current || !section) return;
    const accent = getComputedStyle(current).getPropertyValue('--v38-accent').trim();
    if (accent) section.style.setProperty('--v41-mood', accent);
  };
  const scheduleMood = () => { if (!moodRaf) moodRaf = requestAnimationFrame(syncMood); };
  scheduleMood();
  if (list && 'MutationObserver' in window) {
    new MutationObserver(mutations => {
      if (mutations.some(m => m.type === 'attributes' && m.attributeName === 'class')) scheduleMood();
    }).observe(list, { subtree:true, attributes:true, attributeFilter:['class'] });
  }

  /* --------------------------------------------------------------
     2) Snapshot the exact artwork before the base runtime opens it.
     -------------------------------------------------------------- */
  let snapshot = null;
  let wasOpen = viewer.classList.contains('open');
  let transitionToken = 0;
  let activeAnimations = [];

  const mediaFor = opener => {
    if (!opener) return null;
    if (opener.matches('img')) return opener;
    return opener.querySelector('img') || opener.closest('.project-entry')?.querySelector('.project-cover img') || null;
  };
  const copyRect = rect => ({ left:rect.left, top:rect.top, width:rect.width, height:rect.height });
  const validRect = rect => !!rect && rect.width > 4 && rect.height > 4;
  const visibleRect = rect => validRect(rect) && rect.bottom > 0 && rect.top < innerHeight && rect.right > 0 && rect.left < innerWidth;

  const accentFor = opener => {
    const entry = opener?.closest?.('.project-entry');
    const node = entry || opener;
    const value = node ? getComputedStyle(node).getPropertyValue('--v38-accent').trim() : '';
    return value || getComputedStyle(root).getPropertyValue('--editorial-red').trim() || '#9c2e24';
  };

  const takeSnapshot = opener => {
    if (!opener || viewer.contains(opener)) return;
    const img = mediaFor(opener);
    if (!img) return;
    const rect = img.getBoundingClientRect();
    if (!validRect(rect)) return;
    if (snapshot?.img && snapshot.img !== img) snapshot.img.classList.remove('v86-portal-source-hidden');
    snapshot = {
      opener,
      img,
      src:img.currentSrc || img.src,
      rect:copyRect(rect),
      slug:opener.getAttribute('data-open-project') || opener.closest('[data-open-project]')?.getAttribute('data-open-project') || '',
      accent:accentFor(opener),
      heroRect:null,
      heroImg:null
    };
  };

  document.addEventListener('pointerdown', event => {
    const opener = event.target?.closest?.('[data-open-project]');
    if (opener && !viewer.contains(opener)) takeSnapshot(opener);
  }, { capture:true, passive:true });
  document.addEventListener('focusin', event => {
    const opener = event.target?.closest?.('[data-open-project]');
    if (opener && !viewer.contains(opener)) takeSnapshot(opener);
  }, true);

  if (reduced) {
    root.classList.add('v86-shared-transition-reduced');
    return;
  }

  /* --------------------------------------------------------------
     3) One DOM shared-element stage. No WebGL, no chromatic aberration,
        no grain, no perspective-card motion.
     -------------------------------------------------------------- */
  let stage = null;
  let surface = null;
  let coverLayer = null;
  let containLayer = null;

  const ensureStage = () => {
    if (stage?.isConnected) return true;
    stage = document.createElement('div');
    stage.className = 'v41-project-transition';
    stage.setAttribute('aria-hidden','true');
    stage.innerHTML = '<div class="v86-project-transition__surface"><img class="v86-project-transition__image v86-project-transition__image--cover" alt=""><img class="v86-project-transition__image v86-project-transition__image--contain" alt=""></div>';
    document.body.appendChild(stage);
    surface = stage.querySelector('.v86-project-transition__surface');
    coverLayer = stage.querySelector('.v86-project-transition__image--cover');
    containLayer = stage.querySelector('.v86-project-transition__image--contain');
    return !!(surface && coverLayer && containLayer);
  };

  const cancelAnimations = () => {
    activeAnimations.forEach(animation => {
      try { animation.cancel(); } catch (_) {}
    });
    activeAnimations = [];
  };

  const hideStage = () => {
    cancelAnimations();
    stage?.classList.remove('v41-transition-live');
    root.classList.remove('v86-transition-running','v86-case-leaving');
  };

  const setSource = () => {
    if (!snapshot?.src || !ensureStage()) return false;
    coverLayer.src = snapshot.src;
    containLayer.src = snapshot.src;
    surface.style.setProperty('--v86-accent', snapshot.accent || '#9c2e24');
    return true;
  };

  const place = rect => {
    if (!surface || !validRect(rect)) return;
    surface.style.left = `${rect.left}px`;
    surface.style.top = `${rect.top}px`;
    surface.style.width = `${rect.width}px`;
    surface.style.height = `${rect.height}px`;
    surface.style.transform = 'none';
  };

  const inverseTransform = (from, to) => {
    const sx = clamp(from.width / Math.max(1,to.width), .03, 32);
    const sy = clamp(from.height / Math.max(1,to.height), .03, 32);
    const dx = from.left - to.left;
    const dy = from.top - to.top;
    return `translate3d(${dx}px,${dy}px,0) scale(${sx},${sy})`;
  };

  const targetForOpen = () => {
    const media = viewer.querySelector('.case-hero__media');
    const img = media?.querySelector('img');
    const rect = media?.getBoundingClientRect();
    return media && img && validRect(rect) ? { media, img, rect:copyRect(rect) } : null;
  };

  const waitForOpenTarget = (token, attempt = 0) => {
    if (token !== transitionToken || !viewer.classList.contains('open')) return;
    const target = targetForOpen();
    if (target) { runOpenMorph(token,target); return; }
    if (attempt >= 14) { finishOpen(token,null); return; }
    requestAnimationFrame(() => waitForOpenTarget(token,attempt + 1));
  };

  const animateLayers = direction => {
    const timing = { duration:direction > 0 ? 760 : 680, easing:'cubic-bezier(.16,1,.3,1)', fill:'both' };
    if (direction > 0) {
      activeAnimations.push(coverLayer.animate([
        {opacity:1,offset:0},{opacity:1,offset:.48},{opacity:.18,offset:.88},{opacity:0,offset:1}
      ], timing));
      activeAnimations.push(containLayer.animate([
        {opacity:0,offset:0},{opacity:0,offset:.42},{opacity:.86,offset:.9},{opacity:1,offset:1}
      ], timing));
    } else {
      activeAnimations.push(coverLayer.animate([
        {opacity:0,offset:0},{opacity:.08,offset:.34},{opacity:.92,offset:.82},{opacity:1,offset:1}
      ], timing));
      activeAnimations.push(containLayer.animate([
        {opacity:1,offset:0},{opacity:.96,offset:.4},{opacity:.12,offset:.86},{opacity:0,offset:1}
      ], timing));
    }
  };

  function runOpenMorph(token,target){
    if (token !== transitionToken || !snapshot || !setSource()) { finishOpen(token,target); return; }
    cancelAnimations();
    const from = snapshot.rect;
    const to = target.rect;
    if (!validRect(from) || !validRect(to) || !surface.animate) { finishOpen(token,target); return; }

    snapshot.img?.classList.add('v86-portal-source-hidden');
    target.img.classList.add('v86-portal-target-hidden');
    snapshot.heroRect = copyRect(to);
    snapshot.heroImg = target.img;

    stage.dataset.direction = 'open';
    stage.classList.add('v41-transition-live');
    stage.style.setProperty('--v86-accent', snapshot.accent || '#9c2e24');
    root.classList.add('v86-transition-running','v86-case-arriving');
    place(to);

    const animation = surface.animate([
      { transform:inverseTransform(from,to), clipPath:'inset(0 0 0 0)' },
      { transform:'translate3d(0,0,0) scale(1,1)', clipPath:'inset(0 0 0 0)' }
    ], { duration:760, easing:'cubic-bezier(.16,1,.3,1)', fill:'both' });
    activeAnimations.push(animation);
    animateLayers(1);
    animation.onfinish = () => finishOpen(token,target);
    animation.oncancel = () => {};
  }

  function finishOpen(token,target){
    if (token !== transitionToken) return;
    target?.img?.classList.remove('v86-portal-target-hidden');
    snapshot?.heroImg?.classList.remove('v86-portal-target-hidden');
    snapshot?.img?.classList.remove('v86-portal-source-hidden');
    hideStage();
    requestAnimationFrame(() => root.classList.remove('v86-case-arriving'));
    root.dataset.movxProjectTransition = 'settled';
  }

  const refreshSourceRect = () => {
    if (!snapshot?.opener?.isConnected) return null;
    const img = mediaFor(snapshot.opener);
    const rect = img?.getBoundingClientRect();
    if (!img || !visibleRect(rect)) return null;
    snapshot.img = img;
    snapshot.rect = copyRect(rect);
    return { img, rect:copyRect(rect) };
  };

  const runCloseMorph = token => {
    const destination = refreshSourceRect();
    const from = snapshot?.heroRect;
    if (!snapshot || !destination || !validRect(from) || !setSource() || !surface?.animate) {
      finishClose(token); return;
    }
    cancelAnimations();
    destination.img.classList.add('v86-portal-source-hidden');
    stage.dataset.direction = 'close';
    stage.classList.add('v41-transition-live');
    stage.style.setProperty('--v86-accent', snapshot.accent || '#9c2e24');
    root.classList.add('v86-transition-running','v86-case-leaving');
    place(destination.rect);

    const animation = surface.animate([
      { transform:inverseTransform(from,destination.rect) },
      { transform:'translate3d(0,0,0) scale(1,1)' }
    ], { duration:680, easing:'cubic-bezier(.16,1,.3,1)', fill:'both' });
    activeAnimations.push(animation);
    animateLayers(-1);
    animation.onfinish = () => finishClose(token);
    animation.oncancel = () => {};
  };

  const finishClose = token => {
    if (token !== transitionToken) return;
    snapshot?.img?.classList.remove('v86-portal-source-hidden');
    snapshot?.heroImg?.classList.remove('v86-portal-target-hidden');
    root.classList.remove('v86-case-arriving');
    hideStage();
    root.dataset.movxProjectTransition = 'idle';
  };

  /* --------------------------------------------------------------
     4) Let the existing case viewer own state/navigation. v86 only
        visualises the state change and never blocks input.
     -------------------------------------------------------------- */
  if ('MutationObserver' in window) {
    new MutationObserver(() => {
      const isOpen = viewer.classList.contains('open');
      if (isOpen && !wasOpen) {
        const token = ++transitionToken;
        root.classList.add('v86-case-arriving');
        root.dataset.movxProjectTransition = 'opening';
        if (!snapshot || !setSource()) finishOpen(token,null);
        else {
          stage.dataset.direction = 'open';
          stage.classList.add('v41-transition-live');
          stage.style.setProperty('--v86-accent', snapshot.accent || '#9c2e24');
          place(snapshot.rect);
          coverLayer.style.opacity = '1';
          containLayer.style.opacity = '0';
          waitForOpenTarget(token);
        }
      } else if (!isOpen && wasOpen) {
        const token = ++transitionToken;
        root.dataset.movxProjectTransition = 'closing';
        runCloseMorph(token);
      }
      wasOpen = isOpen;
    }).observe(viewer,{attributes:true,attributeFilter:['class']});
  }

  addEventListener('resize',() => {
    if (!viewer.classList.contains('open') || !snapshot) return;
    const target = targetForOpen();
    if (target) {
      snapshot.heroRect = target.rect;
      snapshot.heroImg = target.img;
    }
  },{passive:true});
})();