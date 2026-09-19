/* MOVX v39 — perceptible parallax + 3D scroll runtime
   One rAF scheduler, viewport-gated media, no text transforms. */
(() => {
  'use strict';

  const root = document.documentElement;
  const reduced = new URLSearchParams(location.search).has('static') || matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(pointer:fine)').matches;
  const q = (selector, context = document) => context.querySelector(selector);
  const qa = (selector, context = document) => [...context.querySelectorAll(selector)];
  const clamp = (v, min = 0, max = 1) => Math.min(max, Math.max(min, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const signedViewportDistance = rect => clamp(((rect.top + rect.height * .5) - innerHeight * .5) / Math.max(1, innerHeight * .78), -1, 1);

  root.classList.add('movx-v39');
  root.dataset.movxDepthMotion = 'v39-parallax-3d-scroll';

  if (reduced) {
    root.classList.add('v39-reduced');
    return;
  }

  try {
    const heroStage = q('.social-cover-art__stage');
    const heroImage = q('.social-cover-art__image', heroStage || document);
    const heroOverlay = q('.v28-hero-overlay', heroStage || document);
    const heroType = q('.v28-hero-plane--type', heroOverlay || document);
    const heroCrt = q('.v28-hero-plane--crt', heroOverlay || document);
    const heroLower = q('.v28-hero-plane--lower', heroOverlay || document);
    const heroGrain = q('.v28-hero-grain', heroOverlay || document);
    const livingArchive = document.getElementById('livingArchive');
    const loopRows = livingArchive ? qa('.loop-row', livingArchive) : [];
    const nicheGrid = document.getElementById('nicheGrid');
    const projectList = document.getElementById('projectsList');
    const viewer = document.getElementById('caseViewer');

    const active = new Set();
    const observeTargets = new Set();
    const projectPointer = new WeakMap();
    let caseFrames = [];
    let projectEntries = [];
    let nicheCards = [];

    const markObserved = node => {
      if (!node || observeTargets.has(node)) return;
      observeTargets.add(node);
      viewportObserver?.observe(node);
    };

    let viewportObserver = null;
    if ('IntersectionObserver' in window) {
      viewportObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) active.add(entry.target);
          else active.delete(entry.target);
        });
        schedule();
      }, { threshold:0, rootMargin:'42% 0px 42% 0px' });
    }

    [heroStage, livingArchive, nicheGrid, projectList, viewer].filter(Boolean).forEach(markObserved);

    const refreshProjects = () => {
      projectEntries = projectList ? qa('.project-entry', projectList) : [];
      projectEntries.forEach((entry, index) => {
        entry.dataset.v39DepthIndex = String(index + 1);
        markObserved(entry);
        if (!finePointer || entry.dataset.v39PointerBound === 'true') return;
        entry.dataset.v39PointerBound = 'true';
        projectPointer.set(entry, { x:0, y:0, tx:0, ty:0 });
        const cover = q('.project-cover', entry);
        if (!cover) return;
        cover.addEventListener('pointermove', event => {
          const rect = cover.getBoundingClientRect();
          if (!rect.width || !rect.height) return;
          const state = projectPointer.get(entry);
          if (!state) return;
          state.tx = clamp(((event.clientX - rect.left) / rect.width - .5) * 2, -1, 1);
          state.ty = clamp(((event.clientY - rect.top) / rect.height - .5) * 2, -1, 1);
          schedule();
        }, { passive:true });
        cover.addEventListener('pointerleave', () => {
          const state = projectPointer.get(entry);
          if (!state) return;
          state.tx = 0;
          state.ty = 0;
          schedule();
        }, { passive:true });
      });
    };

    const refreshNiches = () => {
      nicheCards = nicheGrid ? qa('.niche-card', nicheGrid) : [];
      nicheCards.forEach(markObserved);
    };

    const refreshCaseFrames = () => {
      caseFrames = viewer ? qa('.case-slide-frame', viewer) : [];
      caseFrames.forEach(markObserved);
      schedule();
    };

    refreshProjects();
    refreshNiches();
    refreshCaseFrames();

    if ('MutationObserver' in window) {
      if (projectList) new MutationObserver(refreshProjects).observe(projectList, { childList:true, subtree:true });
      if (nicheGrid) new MutationObserver(refreshNiches).observe(nicheGrid, { childList:true });
      if (viewer) new MutationObserver(mutations => {
        if (mutations.some(m => m.type === 'childList' || (m.type === 'attributes' && m.attributeName === 'class'))) refreshCaseFrames();
      }).observe(viewer, { childList:true, subtree:true, attributes:true, attributeFilter:['class'] });
    }

    const heroPointer = { x:0, y:0, tx:0, ty:0 };
    if (heroStage && finePointer) {
      heroStage.addEventListener('pointermove', event => {
        const rect = heroStage.getBoundingClientRect();
        if (!rect.width || !rect.height) return;
        heroPointer.tx = clamp(((event.clientX - rect.left) / rect.width - .5) * 2, -1, 1);
        heroPointer.ty = clamp(((event.clientY - rect.top) / rect.height - .5) * 2, -1, 1);
        schedule();
      }, { passive:true });
      heroStage.addEventListener('pointerleave', () => {
        heroPointer.tx = 0;
        heroPointer.ty = 0;
        schedule();
      }, { passive:true });
    }

    let raf = 0;
    let lastScrollY = scrollY;
    let lastScrollAt = performance.now();
    let velocityTarget = 0;
    let velocity = 0;

    function setPx(node, name, value) { node?.style.setProperty(name, `${value.toFixed(2)}px`); }
    function setDeg(node, name, value) { node?.style.setProperty(name, `${value.toFixed(2)}deg`); }
    function setNum(node, name, value) { node?.style.setProperty(name, value.toFixed(4)); }

    function paintHero() {
      if (!heroStage || !heroImage || !active.has(heroStage)) return false;
      const rect = heroStage.getBoundingClientRect();
      const progress = clamp((-rect.top) / Math.max(1, rect.height * .78), 0, 1.15);
      heroPointer.x = lerp(heroPointer.x, heroPointer.tx, .13);
      heroPointer.y = lerp(heroPointer.y, heroPointer.ty, .13);
      const px = heroPointer.x;
      const py = heroPointer.y;

      setPx(heroStage, '--v39-hero-bg-x', -px * 15);
      setPx(heroStage, '--v39-hero-bg-y', -progress * 54 - py * 10);
      setNum(heroStage, '--v39-hero-bg-scale', 1.065 + progress * .055);

      if (heroOverlay) {
        setPx(heroOverlay, '--v39-hero-x', px * 24);
        setPx(heroOverlay, '--v39-hero-y', -progress * 76 + py * 18);
        setPx(heroOverlay, '--v39-hero-z', 38 + progress * 64);
        setDeg(heroOverlay, '--v39-hero-rx', -py * 2.8 + progress * 2.2);
        setDeg(heroOverlay, '--v39-hero-ry', px * 4.2);
        setNum(heroOverlay, '--v39-hero-scale', 1.045 + progress * .028);
      }
      setPx(heroType, '--v39-type-x', -px * 34 - progress * 24);
      setPx(heroType, '--v39-type-y', -progress * 46 - py * 15);
      setDeg(heroType, '--v39-type-ry', -px * 2.5);
      setPx(heroCrt, '--v39-crt-x', px * 46 + progress * 32);
      setPx(heroCrt, '--v39-crt-y', -progress * 112 + py * 24);
      setDeg(heroCrt, '--v39-crt-ry', px * 5.4);
      setPx(heroLower, '--v39-lower-x', px * 26 - progress * 12);
      setPx(heroLower, '--v39-lower-y', -progress * 78 + py * 17);
      setDeg(heroLower, '--v39-lower-rx', -py * 3.2);
      setPx(heroGrain, '--v39-grain-x', px * 10);
      setPx(heroGrain, '--v39-grain-y', py * 8 - progress * 18);

      return Math.abs(heroPointer.x - heroPointer.tx) > .008 || Math.abs(heroPointer.y - heroPointer.ty) > .008;
    }

    function paintArchive() {
      if (!livingArchive || !active.has(livingArchive) || !loopRows.length) return;
      const rect = livingArchive.getBoundingClientRect();
      const progress = clamp((innerHeight - rect.top) / Math.max(1, innerHeight + rect.height), 0, 1);
      const t = (progress - .5) * 2;
      const amplitudes = [
        { y:-38, z:44, rx:3.8, rz:-.75 },
        { y:46, z:74, rx:-4.6, rz:.62 },
        { y:-30, z:52, rx:3.2, rz:-.42 }
      ];
      loopRows.forEach((row, index) => {
        const a = amplitudes[index % amplitudes.length];
        setPx(row, '--v39-row-y', t * a.y + velocity * (index === 1 ? -8 : 7));
        setPx(row, '--v39-row-z', (1 - Math.abs(t)) * a.z - 16);
        setDeg(row, '--v39-row-rx', t * a.rx);
        setDeg(row, '--v39-row-rz', t * a.rz + velocity * .22 * (index % 2 ? -1 : 1));
      });
    }

    function paintNiches() {
      if (innerWidth <= 900) return;
      nicheCards.forEach((card, index) => {
        if (!active.has(card)) return;
        const media = q('.niche-card__media', card);
        if (!media) return;
        const d = signedViewportDistance(card.getBoundingClientRect());
        const strength = 1 - Math.abs(d);
        const dir = index % 2 ? -1 : 1;
        setPx(media, '--v39-niche-y', -d * 36);
        setPx(media, '--v39-niche-z', -28 + strength * 66);
        setDeg(media, '--v39-niche-rx', d * 4.2);
        setDeg(media, '--v39-niche-ry', dir * d * 6.4);
        setNum(media, '--v39-niche-scale', .985 + strength * .035);
        setPx(media, '--v39-niche-img-x', dir * d * 14);
        setPx(media, '--v39-niche-img-y', d * 20);
      });
    }

    function paintProjects() {
      if (!projectEntries.length) return false;
      let closest = null;
      let closestDistance = Infinity;
      let pointerUnsettled = false;

      projectEntries.forEach((entry, index) => {
        const cover = q('.project-cover', entry);
        const image = cover && q('img', cover);
        if (!cover || !image) return;
        const rect = entry.getBoundingClientRect();
        const d = signedViewportDistance(rect);
        const abs = Math.abs(d);
        if (abs < closestDistance && rect.bottom > 0 && rect.top < innerHeight) {
          closestDistance = abs;
          closest = entry;
        }
        if (!active.has(entry)) return;

        const strength = 1 - abs;
        const dir = index % 2 ? -1 : 1;
        const pointer = projectPointer.get(entry) || { x:0,y:0,tx:0,ty:0 };
        pointer.x = lerp(pointer.x || 0, pointer.tx || 0, .14);
        pointer.y = lerp(pointer.y || 0, pointer.ty || 0, .14);
        if (projectPointer.has(entry)) projectPointer.set(entry, pointer);
        if (Math.abs(pointer.x - pointer.tx) > .008 || Math.abs(pointer.y - pointer.ty) > .008) pointerUnsettled = true;

        const desktop3d = innerWidth > 980;
        const ry = desktop3d ? (-dir * d * 15 + pointer.x * 5.5) : 0;
        const rx = desktop3d ? (d * 9 - pointer.y * 3.6) : 0;
        const rz = desktop3d ? (dir * d * .9 - velocity * dir * .8) : 0;
        const z = desktop3d ? (-92 + strength * 168) : 0;
        const y = -d * (desktop3d ? 78 : 24) + velocity * 8;
        const x = desktop3d ? dir * (1 - strength) * 18 : 0;
        const scale = desktop3d ? (.95 + strength * .075) : (.99 + strength * .018);

        setPx(cover, '--v39-project-x', x);
        setPx(cover, '--v39-project-y', y);
        setPx(cover, '--v39-project-z', z);
        setDeg(cover, '--v39-project-rx', rx);
        setDeg(cover, '--v39-project-ry', ry);
        setDeg(cover, '--v39-project-rz', rz);
        setNum(cover, '--v39-project-scale', scale);
        setPx(cover, '--v39-project-shadow-y', 18 + abs * 18);
        setPx(cover, '--v39-project-shadow-blur', 38 + abs * 22);
        setNum(cover, '--v39-project-shadow-a', .09 + strength * .10);
        setPx(cover, '--v39-project-img-x', pointer.x * 15 + dir * d * 14);
        setPx(cover, '--v39-project-img-y', pointer.y * 12 + d * 24);
        setNum(cover, '--v39-project-img-scale', 1.09 + strength * .025);
      });

      projectEntries.forEach(entry => entry.classList.toggle('v39-depth-current', entry === closest));
      return pointerUnsettled;
    }

    function paintCaseFrames() {
      if (!viewer?.classList.contains('open')) return;
      caseFrames.forEach((frame, index) => {
        if (!active.has(frame)) return;
        const rect = frame.getBoundingClientRect();
        const d = signedViewportDistance(rect);
        const strength = 1 - Math.abs(d);
        const dir = index % 2 ? -1 : 1;
        setPx(frame, '--v39-case-x', dir * d * 12);
        setPx(frame, '--v39-case-y', -d * 46);
        setPx(frame, '--v39-case-z', -70 + strength * 112);
        setDeg(frame, '--v39-case-rx', d * 6.6);
        setDeg(frame, '--v39-case-ry', dir * d * 3.8);
        setNum(frame, '--v39-case-scale', .975 + strength * .035);
        setPx(frame, '--v39-case-img-y', d * 18);
      });
    }

    function frame() {
      raf = 0;
      heroPointer.x = lerp(heroPointer.x, heroPointer.tx, .12);
      heroPointer.y = lerp(heroPointer.y, heroPointer.ty, .12);
      velocity = lerp(velocity, velocityTarget, .18);
      velocityTarget *= .72;

      const heroUnsettled = paintHero();
      paintArchive();
      paintNiches();
      const pointerUnsettled = paintProjects();
      paintCaseFrames();

      const moving = heroUnsettled || pointerUnsettled || Math.abs(velocity) > .012 || Math.abs(velocityTarget) > .012;
      if (moving) schedule();
    }

    function schedule() {
      if (!raf) raf = requestAnimationFrame(frame);
    }

    addEventListener('scroll', () => {
      const now = performance.now();
      const dy = scrollY - lastScrollY;
      const dt = Math.max(16, now - lastScrollAt);
      velocityTarget = clamp(dy / dt, -2.4, 2.4);
      lastScrollY = scrollY;
      lastScrollAt = now;
      schedule();
    }, { passive:true });
    addEventListener('resize', schedule, { passive:true });
    addEventListener('load', schedule, { once:true });
    document.addEventListener('visibilitychange', () => { if (!document.hidden) schedule(); }, { passive:true });
    schedule();

  } catch (error) {
    console.warn('MOVX v39 depth motion failed open:', error);
  }
})();
