/* MOVX v42 — lower-section parallax runtime
   Perceptible depth belongs to decorative section planes, not the copy itself.
   One rAF scheduler, four sections, pointer drift on fine pointers, fail-open. */
(() => {
  'use strict';

  const root = document.documentElement;
  const reduced = new URLSearchParams(location.search).has('static') || matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(pointer:fine)').matches;
  const q = (selector, context = document) => context.querySelector(selector);
  const qa = (selector, context = document) => [...context.querySelectorAll(selector)];
  const clamp = (v, a = -1, b = 1) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;

  root.classList.add('movx-v42');
  root.dataset.movxLowerParallax = 'v42-authored-depth';

  try {
    const defs = [
      ['.about-section','04'],
      ['.services-section','05'],
      ['.process-section','06'],
      ['.contact-section','07']
    ];

    const sections = defs.map(([selector,index], slot) => {
      const node = q(selector);
      if (!node) return null;

      let layer = q('.v42-parallax-layer', node);
      if (!layer) {
        layer = document.createElement('div');
        layer.className = 'v42-parallax-layer';
        layer.setAttribute('aria-hidden','true');

        const ghost = document.createElement('div');
        ghost.className = 'v42-parallax-ghost';
        const heading = q('h2', node);
        ghost.textContent = heading?.textContent?.trim() || (slot === 0 ? 'Sobre' : slot === 1 ? 'Serviços' : slot === 2 ? 'Processo' : 'Contato');

        const rule = document.createElement('div');
        rule.className = 'v42-parallax-rule';

        const chapter = document.createElement('div');
        chapter.className = 'v42-parallax-index';
        chapter.textContent = index;

        layer.append(ghost, rule, chapter);
        node.insertBefore(layer, node.firstChild);
      }

      return {
        node,
        layer,
        ghost:q('.v42-parallax-ghost', layer),
        rule:q('.v42-parallax-rule', layer),
        index:q('.v42-parallax-index', layer),
        slot,
        active:true
      };
    }).filter(Boolean);

    if (!sections.length || reduced) return;

    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          const item = sections.find(section => section.node === entry.target);
          if (item) item.active = entry.isIntersecting;
        });
        schedule();
      }, { threshold:0, rootMargin:'32% 0px 32% 0px' });
      sections.forEach(section => io.observe(section.node));
    }

    const pointer = { x:0, y:0, tx:0, ty:0 };
    if (finePointer) {
      addEventListener('pointermove', event => {
        pointer.tx = clamp((event.clientX / Math.max(1,innerWidth) - .5) * 2);
        pointer.ty = clamp((event.clientY / Math.max(1,innerHeight) - .5) * 2);
        schedule();
      }, { passive:true });
      addEventListener('pointerleave', () => {
        pointer.tx = 0;
        pointer.ty = 0;
        schedule();
      }, { passive:true });
    }

    let raf = 0;
    let lastY = scrollY;
    let lastTime = performance.now();
    let velocity = 0;
    let velocityTarget = 0;

    const setPx = (node, name, value) => node?.style.setProperty(name, `${value.toFixed(2)}px`);
    const setDeg = (node, name, value) => node?.style.setProperty(name, `${value.toFixed(2)}deg`);
    const setNum = (node, name, value) => node?.style.setProperty(name, value.toFixed(4));

    function signedProgress(rect){
      const center = rect.top + rect.height * .5;
      return clamp((center - innerHeight * .5) / Math.max(innerHeight * .78, rect.height * .58));
    }

    function paintSections(){
      pointer.x = lerp(pointer.x, pointer.tx, .11);
      pointer.y = lerp(pointer.y, pointer.ty, .11);

      sections.forEach(section => {
        if (!section.active) return;
        const rect = section.node.getBoundingClientRect();
        const p = signedProgress(rect);
        const abs = Math.abs(p);
        const dir = section.slot % 2 ? -1 : 1;
        const centerStrength = 1 - abs;

        setPx(section.layer, '--v42-ghost-x', dir * p * 116 + pointer.x * 20);
        setPx(section.layer, '--v42-ghost-y', p * 148 + pointer.y * 15 + velocity * 9);
        setPx(section.layer, '--v42-ghost-z', -165 + centerStrength * 230);
        setDeg(section.layer, '--v42-ghost-r', dir * p * 2.4 + velocity * .28);
        setNum(section.layer, '--v42-ghost-s', .96 + centerStrength * .075);

        setPx(section.layer, '--v42-rule-x', -dir * p * 76 - pointer.x * 9);
        setPx(section.layer, '--v42-rule-y', -p * 76 + velocity * -5);
        setPx(section.layer, '--v42-rule-z', 18 + centerStrength * 86);
        setDeg(section.layer, '--v42-rule-r', -dir * p * 1.1);

        setPx(section.layer, '--v42-index-x', dir * p * 36 + pointer.x * 8);
        setPx(section.layer, '--v42-index-y', p * 96 + pointer.y * 8);
      });
    }

    function focusRows(){
      const groups = [q('.services-list'), q('.process-list')].filter(Boolean);
      groups.forEach(group => {
        const rows = qa(group.matches('.services-list') ? '.service-row' : 'li', group);
        let closest = null;
        let best = Infinity;
        rows.forEach(row => {
          const rect = row.getBoundingClientRect();
          if (rect.bottom < 0 || rect.top > innerHeight) return;
          const dist = Math.abs(rect.top + rect.height * .5 - innerHeight * .52);
          if (dist < best) { best = dist; closest = row; }
        });
        group.classList.toggle('v42-scroll-focus', !!closest);
        rows.forEach(row => row.classList.toggle('v42-reading', row === closest));
      });
    }

    function frame(){
      raf = 0;
      velocity = lerp(velocity, velocityTarget, .17);
      velocityTarget *= .76;
      paintSections();
      focusRows();

      const unsettled = Math.abs(pointer.x-pointer.tx)>.006 || Math.abs(pointer.y-pointer.ty)>.006 || Math.abs(velocity)>.008 || Math.abs(velocityTarget)>.008;
      if (unsettled && !document.hidden) schedule();
    }

    function schedule(){
      if (!raf && !document.hidden) raf = requestAnimationFrame(frame);
    }

    addEventListener('scroll', () => {
      const now = performance.now();
      const dy = scrollY - lastY;
      const dt = Math.max(16, now - lastTime);
      lastY = scrollY;
      lastTime = now;
      velocityTarget = clamp((dy/dt)*2.8, -1.5, 1.5);
      schedule();
    }, { passive:true });

    addEventListener('resize', schedule, { passive:true });
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) schedule();
      else if (raf) { cancelAnimationFrame(raf); raf = 0; }
    }, { passive:true });

    schedule();
  } catch (error) {
    console.warn('MOVX v42 lower-section parallax failed open:', error);
  }
})();
