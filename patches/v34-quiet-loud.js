/* MOVX v34 — quiet frame / loud work runtime
   Project-led accents + deliberate prewarming for faster case-study opening.
   Additive and fail-open: no content depends on this layer. */
(() => {
  'use strict';

  const root = document.documentElement;
  const projects = Array.isArray(window.MOVX_PROJECTS) ? window.MOVX_PROJECTS : [];
  const q = (selector, context = document) => context.querySelector(selector);
  const qa = (selector, context = document) => [...context.querySelectorAll(selector)];
  const reduced = new URLSearchParams(location.search).has('static') || matchMedia('(prefers-reduced-motion: reduce)').matches;

  root.classList.add('movx-v34');
  root.dataset.movxQuietFrame = 'v34';

  if (!projects.length) return;

  const projectBySlug = new Map(projects.map(project => [project.slug, project]));
  const warmed = new Set();

  const formatName = format => ({
    carousel:'Carousel',
    campaign:'Campaign',
    product:'Product',
    system:'Visual system'
  }[format] || String(format || 'Project'));

  const findProjectNode = node => node?.closest?.('[data-open-project]') || null;

  const decorateProjectNodes = context => {
    qa('[data-open-project]', context).forEach(node => {
      const slug = node.getAttribute('data-open-project');
      const project = projectBySlug.get(slug);
      if (!project) return;
      node.style.setProperty('--v34-project-accent', project.accent || 'var(--editorial-red,#9c2e24)');
      node.dataset.v34Format = formatName(project.format);
      node.dataset.v34Project = project.slug;

      const preview = q('.selected-index-row__preview', node);
      if (preview) preview.dataset.v34Format = formatName(project.format);
    });
  };

  const warmImage = src => {
    if (!src || warmed.has(src)) return;
    warmed.add(src);
    const image = new Image();
    image.decoding = 'async';
    image.src = src;
    if (image.decode) image.decode().catch(() => {});
  };

  const prewarmProject = project => {
    if (!project) return;
    warmImage(project.cover);
    const slides = Array.isArray(project.slides) ? project.slides : [];
    slides.slice(0,3).forEach(warmImage);
  };

  try {
    decorateProjectNodes(document);

    /* Generated archives rerender after filters / locale changes. */
    const dynamicHosts = [
      document.getElementById('loopWall'),
      document.getElementById('archiveGrid'),
      document.getElementById('projectsList')
    ].filter(Boolean);

    if ('MutationObserver' in window) {
      dynamicHosts.forEach(host => {
        let scheduled = false;
        new MutationObserver(() => {
          if (scheduled) return;
          scheduled = true;
          requestAnimationFrame(() => {
            scheduled = false;
            decorateProjectNodes(host);
          });
        }).observe(host, { childList:true, subtree:true });
      });
    }

    /* Warm only on intent, not on page load. Keeps initial network quiet. */
    const intentHandler = event => {
      const node = findProjectNode(event.target);
      if (!node) return;
      const project = projectBySlug.get(node.getAttribute('data-open-project'));
      prewarmProject(project);
    };

    document.addEventListener('pointerover', intentHandler, { passive:true, capture:true });
    document.addEventListener('focusin', intentHandler, true);
    document.addEventListener('pointerdown', intentHandler, { passive:true, capture:true });

    /* Selected-work previews get only a tiny damped vertical response. */
    if (!reduced && matchMedia('(pointer:fine)').matches) {
      let activeRow = null;
      let target = 0;
      let current = 0;
      let raf = 0;

      const tick = () => {
        raf = 0;
        current += (target - current) * .12;
        if (activeRow) {
          const preview = q('.selected-index-row__preview', activeRow);
          if (preview) preview.style.setProperty('--v34-preview-y', `${current.toFixed(2)}px`);
        }
        if (Math.abs(target-current) > .05) raf = requestAnimationFrame(tick);
      };

      qa('#projectsList .selected-index-row').forEach(row => {
        row.addEventListener('pointerenter', () => {
          activeRow = row;
          target = 0;
          current = 0;
        }, { passive:true });
        row.addEventListener('pointermove', event => {
          const rect = row.getBoundingClientRect();
          if (!rect.height) return;
          const y = Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height));
          target = (y - .5) * 8;
          if (!raf) raf = requestAnimationFrame(tick);
        }, { passive:true });
        row.addEventListener('pointerleave', () => {
          target = 0;
          if (!raf) raf = requestAnimationFrame(tick);
          activeRow = null;
        }, { passive:true });
      });
    }

  } catch (error) {
    console.warn('MOVX v34 quiet-frame enhancement failed open:', error);
  }
})();
