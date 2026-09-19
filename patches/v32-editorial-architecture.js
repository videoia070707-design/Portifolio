/* MOVX v32 — editorial architecture runtime
   Adds authored chapter markers, generated-list numbering and slow section presence.
   Additive and fail-open: all content stays visible without JavaScript. */
(() => {
  'use strict';

  const root = document.documentElement;
  const reduced = new URLSearchParams(location.search).has('static') || matchMedia('(prefers-reduced-motion: reduce)').matches;
  const q = (selector, context = document) => context.querySelector(selector);
  const qa = (selector, context = document) => [...context.querySelectorAll(selector)];

  root.classList.add('movx-v32');
  root.dataset.movxArchitecture = 'v32-editorial';

  try {
    /* -------------------------------------------------------
       1) Editorial chapter labels. Kept outside the content flow
          on desktop, but collapse into the flow on small screens.
       ------------------------------------------------------- */
    const chapters = [
      { node: document.getElementById('livingArchive'), index: '01', label: 'Arquivo vivo' },
      { node: document.getElementById('nicheIndex'), index: '02', label: 'Territórios' },
      { node: document.getElementById('archiveControls'), index: '03', label: 'Arquivo' },
      { node: document.getElementById('projectsList') || q('.projects-list'), index: '04', label: 'Selecionados' },
      { node: document.getElementById('about') || q('.about-section'), index: '05', label: 'Sobre' },
      { node: document.getElementById('services') || q('.services-section'), index: '06', label: 'Serviços' },
      { node: document.getElementById('process') || q('.process-section'), index: '07', label: 'Processo' },
      { node: document.getElementById('contact') || q('.contact-section'), index: '08', label: 'Contato' }
    ].filter(item => item.node);

    chapters.forEach(({ node, index, label }) => {
      node.dataset.v32Index = index;
      node.dataset.v32Label = label;
    });

    if ('IntersectionObserver' in window && !reduced) {
      const sectionObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) entry.target.classList.add('v32-section-live');
        });
      }, { threshold: .08, rootMargin: '0px 0px -12% 0px' });
      chapters.forEach(({ node }) => sectionObserver.observe(node));
    } else {
      chapters.forEach(({ node }) => node.classList.add('v32-section-live'));
    }

    /* -------------------------------------------------------
       2) Number generated selected-work rows after every render.
          MutationObserver is used because the archive is data-driven.
       ------------------------------------------------------- */
    const projectHost = document.getElementById('projectsList') || q('.projects-list');
    const numberRows = () => {
      if (!projectHost) return;
      qa('.selected-index-row', projectHost).forEach((row, index) => {
        row.dataset.v32Order = String(index + 1).padStart(2, '0');
      });
    };

    numberRows();
    if (projectHost && 'MutationObserver' in window) {
      let scheduled = false;
      const observer = new MutationObserver(() => {
        if (scheduled) return;
        scheduled = true;
        requestAnimationFrame(() => {
          scheduled = false;
          numberRows();
        });
      });
      observer.observe(projectHost, { childList:true, subtree:true });
    }

    /* -------------------------------------------------------
       3) Make grid rerenders settle as one composition instead
          of each card snapping independently.
       ------------------------------------------------------- */
    const gridHosts = [document.getElementById('nicheGrid'), document.getElementById('archiveGrid')].filter(Boolean);
    const settleGrid = host => {
      if (reduced) return;
      host.classList.remove('v32-grid-settled');
      requestAnimationFrame(() => requestAnimationFrame(() => host.classList.add('v32-grid-settled')));
    };

    gridHosts.forEach(host => {
      settleGrid(host);
      if (!('MutationObserver' in window)) return;
      let timer = 0;
      new MutationObserver(() => {
        clearTimeout(timer);
        timer = setTimeout(() => settleGrid(host), 36);
      }).observe(host, { childList:true });
    });

    /* -------------------------------------------------------
       4) Stronger authored rhythm for filters: keyboard focus and
          pointer interaction both keep one current control visible.
          We do not override the app's filtering logic.
       ------------------------------------------------------- */
    const filterHost = document.getElementById('archiveControls');
    if (filterHost) {
      qa('button', filterHost).forEach(button => {
        button.addEventListener('focusin', () => button.classList.add('v32-filter-focus'));
        button.addEventListener('focusout', () => button.classList.remove('v32-filter-focus'));
      });
    }

  } catch (error) {
    console.warn('MOVX v32 architecture failed open:', error);
  }
})();
