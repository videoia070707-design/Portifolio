/* MOVX v38 — selected cases / interaction QA runtime
   Adds semantic keyboard access, case-dialog focus management, project accents,
   near-viewport media decoding and composition-level filter settling. */
(() => {
  'use strict';

  const root = document.documentElement;
  const reduced = new URLSearchParams(location.search).has('static') || matchMedia('(prefers-reduced-motion: reduce)').matches;
  const projects = Array.isArray(window.MOVX_PROJECTS) ? window.MOVX_PROJECTS : [];
  const bySlug = new Map(projects.map(project => [project.slug, project]));
  const projectList = document.getElementById('projectsList');
  const archiveGrid = document.getElementById('archiveGrid');
  const viewer = document.getElementById('caseViewer');
  const closeButton = document.getElementById('caseClose');
  const q = (selector, context = document) => context.querySelector(selector);
  const qa = (selector, context = document) => [...context.querySelectorAll(selector)];

  root.classList.add('movx-v38');
  root.dataset.movxSelectedCases = 'v38-editorial-focus';

  try {
    const decorateEntries = context => {
      if (!context) return;

      qa('.project-entry', context).forEach(entry => {
        const trigger = q('[data-open-project]', entry);
        const slug = trigger?.getAttribute('data-open-project');
        const project = bySlug.get(slug);
        if (project) {
          entry.dataset.v38Project = slug;
          entry.style.setProperty('--v38-accent', project.accent || 'var(--editorial-red,#9c2e24)');
        }
      });

      qa('.archive-card[data-open-project], .selected-index-row[data-open-project], .project-cover[data-open-project]', context).forEach(node => {
        if (node.matches('button,a,input,select,textarea')) return;
        node.setAttribute('role','button');
        node.setAttribute('tabindex','0');
        node.dataset.v38KeyboardProject = 'true';
        const slug = node.getAttribute('data-open-project');
        const project = bySlug.get(slug);
        const imageAlt = q('img', node)?.getAttribute('alt');
        if (!node.hasAttribute('aria-label')) {
          node.setAttribute('aria-label', imageAlt || project?.client || 'Abrir projeto');
        }
      });
    };

    decorateEntries(document);

    if ('MutationObserver' in window) {
      [projectList, archiveGrid].filter(Boolean).forEach(host => {
        let scheduled = false;
        new MutationObserver(() => {
          if (scheduled) return;
          scheduled = true;
          requestAnimationFrame(() => {
            scheduled = false;
            decorateEntries(host);
          });
        }).observe(host, { childList:true, subtree:true });
      });
    }

    document.addEventListener('keydown', event => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      const target = event.target?.closest?.('[data-v38-keyboard-project="true"]');
      if (!target) return;
      if (event.target.closest('button,a,input,select,textarea') && event.target !== target) return;
      event.preventDefault();
      target.click();
    });

    /* Decode project covers just before they are likely to enter the viewport. */
    const prepareMedia = node => {
      const img = q('img', node);
      if (!img || img.dataset.v38Prepared === 'true') return;
      img.dataset.v38Prepared = 'true';
      if (img.getAttribute('fetchpriority') === 'low') img.setAttribute('fetchpriority','auto');
      if (img.decode) img.decode().catch(() => {});
    };

    if ('IntersectionObserver' in window && !reduced) {
      const mediaObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          prepareMedia(entry.target);
          mediaObserver.unobserve(entry.target);
        });
      }, { threshold:0, rootMargin:'900px 0px' });
      qa('#projectsList .project-cover, #archiveGrid .archive-card').forEach(node => mediaObserver.observe(node));
    } else {
      qa('#projectsList .project-cover, #archiveGrid .archive-card').forEach(prepareMedia);
    }

    /* Project-list filtering changes classes rather than children. Settle the whole
       chapter once instead of animating every entry independently. */
    if (projectList && 'MutationObserver' in window) {
      let timer = 0;
      new MutationObserver(mutations => {
        const entryChanged = mutations.some(m =>
          m.type === 'attributes' &&
          m.attributeName === 'class' &&
          m.target instanceof Element &&
          m.target.classList.contains('project-entry')
        );
        if (!entryChanged) return;
        projectList.classList.add('v38-list-updating');
        clearTimeout(timer);
        timer = setTimeout(() => projectList.classList.remove('v38-list-updating'), 150);
      }).observe(projectList, { subtree:true, attributes:true, attributeFilter:['class'] });
    }

    /* Case viewer behaves like a real dialog and returns focus to its opener. */
    let lastOpener = null;
    let wasOpen = viewer?.classList.contains('open') || false;

    document.addEventListener('pointerdown', event => {
      const opener = event.target?.closest?.('[data-open-project]');
      if (opener && !viewer?.contains(opener)) lastOpener = opener;
    }, { capture:true, passive:true });
    document.addEventListener('focusin', event => {
      const opener = event.target?.closest?.('[data-open-project]');
      if (opener && !viewer?.contains(opener)) lastOpener = opener;
    }, true);

    if (viewer) {
      viewer.setAttribute('role','dialog');
      viewer.setAttribute('aria-modal','true');
      viewer.setAttribute('tabindex','-1');

      const focusables = () => qa('button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])', viewer)
        .filter(node => !node.disabled && node.getClientRects().length);

      viewer.addEventListener('keydown', event => {
        if (event.key !== 'Tab' || !viewer.classList.contains('open')) return;
        const nodes = focusables();
        if (!nodes.length) { event.preventDefault(); viewer.focus({preventScroll:true}); return; }
        const first = nodes[0];
        const last = nodes[nodes.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault(); last.focus({preventScroll:true});
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault(); first.focus({preventScroll:true});
        }
      });

      if ('MutationObserver' in window) {
        new MutationObserver(() => {
          const isOpen = viewer.classList.contains('open');
          if (isOpen && !wasOpen) {
            requestAnimationFrame(() => requestAnimationFrame(() => {
              (closeButton || viewer).focus({preventScroll:true});
            }));
          }
          if (!isOpen && wasOpen && lastOpener?.isConnected) {
            requestAnimationFrame(() => lastOpener.focus?.({preventScroll:true}));
          }
          wasOpen = isOpen;
        }).observe(viewer, { attributes:true, attributeFilter:['class'] });
      }
    }

  } catch (error) {
    console.warn('MOVX v38 selected-case enhancement failed open:', error);
  }
})();
