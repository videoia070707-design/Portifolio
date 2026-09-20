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

/* MOVX v63 — selected cases + case-study editorial continuity
   Builds an authored chapter handoff, removes legacy case-slide tilt and keeps motion inside artwork. */
(() => {
  'use strict';
  const root=document.documentElement;
  const reduced=new URLSearchParams(location.search).has('static')||matchMedia('(prefers-reduced-motion: reduce)').matches;
  const section=document.querySelector('.projects-list');
  const list=document.getElementById('projectsList');
  const viewer=document.getElementById('caseViewer');
  const sourceLabel=document.querySelector('.hero-index__item--cases strong');

  root.classList.add('movx-v63');
  root.dataset.movxSelectedPolish='v63-editorial-sequence';

  if(!document.getElementById('movx-v63-selected-style')){
    const style=document.createElement('style');
    style.id='movx-v63-selected-style';
    style.textContent=`
      html.movx-v63 body{--v63-ease:cubic-bezier(.16,1,.3,1);--v63-ui:cubic-bezier(.4,0,.2,1)}

      html.movx-v63 body[data-page="social"] .projects-list{
        padding:clamp(72px,7vw,112px) 0 clamp(112px,10vw,168px)!important;
      }
      html.movx-v63 body[data-page="social"] .v63-selected-head{
        display:grid;grid-template-columns:repeat(12,minmax(0,1fr));gap:clamp(18px,2vw,32px);
        align-items:end;padding-bottom:clamp(30px,3.4vw,48px);border-bottom:1px solid color-mix(in srgb,var(--fg) 24%,transparent)
      }
      html.movx-v63 body[data-page="social"] .v63-selected-head h2{
        grid-column:1 / span 9;margin:0;max-width:8.5ch;
        font-family:var(--serif,Georgia,'Times New Roman',serif);font-weight:400;
        font-size:clamp(68px,8.2vw,132px);line-height:.82;letter-spacing:-.072em;text-wrap:balance;color:var(--fg)
      }
      html.movx-v63 body[data-page="social"] .v63-selected-head__meta{
        grid-column:10 / span 3;justify-self:end;display:flex;align-items:center;gap:12px;
        padding-bottom:7px;font:700 9px/1 var(--mono,ui-monospace,monospace);letter-spacing:.16em;text-transform:uppercase;color:var(--muted)
      }
      html.movx-v63 body[data-page="social"] .v63-selected-head__meta i{display:block;width:42px;height:1px;background:color-mix(in srgb,var(--fg) 24%,transparent)}
      html.movx-v63 body[data-page="social"] #projectsList{padding-top:0!important}
      html.movx-v63 body[data-page="social"] #projectsList::before,
      html.movx-v63 body[data-page="social"] #projectsList::after{display:none!important}
      html.movx-v63 body[data-page="social"] #projectsList .project-entry:first-child{padding-top:clamp(64px,6vw,98px)!important}
      html.movx-v63 body[data-page="social"] #projectsList .project-entry{padding-top:clamp(82px,7.6vw,126px)!important;padding-bottom:clamp(82px,7.6vw,126px)!important}
      html.movx-v63 body[data-page="social"] #projectsList .project-entry::before{height:1px!important;opacity:.62!important}
      html.movx-v63 body[data-page="social"] #projectsList .project-entry:hover::before,
      html.movx-v63 body[data-page="social"] #projectsList .project-entry:focus-within::before{opacity:1!important}

      html.movx-v63 .case-top{height:62px!important;background:color-mix(in srgb,var(--bg) 95%,transparent)!important}
      html.movx-v63 .case-top-row{height:60px!important}
      html.movx-v63 .case-close,
      html.movx-v63 .case-nav-button{
        border:0!important;border-radius:0!important;box-shadow:none!important;background:transparent!important;
        padding:10px 0!important;font-size:9px!important;letter-spacing:.12em!important
      }
      html.movx-v63 .case-close::after,
      html.movx-v63 .case-nav-button::after{bottom:3px!important;height:1px!important}

      html.movx-v63 .v33-case-intro .case-lead{
        max-width:13.5ch!important;font-family:var(--serif,Georgia,'Times New Roman',serif)!important;
        font-weight:400!important;font-size:clamp(42px,5.6vw,84px)!important;
        line-height:.91!important;letter-spacing:-.064em!important
      }
      html.movx-v63 .v33-case-intro .case-description{max-width:50ch!important}

      html.movx-v63 .case-viewer .case-slide-frame{
        transform:none!important;filter:none!important;overflow:hidden!important;backface-visibility:hidden!important
      }
      html.movx-v63 .case-viewer .case-slide-frame img{
        transform:translate3d(0,var(--v39-case-img-y,0px),0) scale(1.018)!important;
        transition:transform 1.45s var(--v63-ease),filter .9s var(--v63-ui)!important;will-change:transform
      }
      html.movx-v63 .case-viewer .case-slide-frame:hover img{transform:translate3d(0,var(--v39-case-img-y,0px),0) scale(1.024)!important}

      @media(min-width:721px) and (prefers-reduced-motion:no-preference){
        html.movx-v63 .case-viewer .case-slide-frame.v63-case-stage{
          opacity:.36;clip-path:inset(3.2% 0 0 0);-webkit-clip-path:inset(3.2% 0 0 0);
          transition:opacity 1.05s var(--v63-ease),clip-path 1.32s var(--v63-ease),-webkit-clip-path 1.32s var(--v63-ease)!important
        }
        html.movx-v63 .case-viewer .case-slide-frame.v63-case-stage.v63-case-in{
          opacity:1;clip-path:inset(0);-webkit-clip-path:inset(0)
        }
      }
      @media(max-width:720px){
        html.movx-v63 body[data-page="social"] .projects-list{padding:72px 0 104px!important}
        html.movx-v63 body[data-page="social"] .v63-selected-head{grid-template-columns:1fr!important;gap:22px!important;padding-bottom:28px!important}
        html.movx-v63 body[data-page="social"] .v63-selected-head h2{grid-column:1!important;max-width:9ch;font-size:clamp(50px,14vw,72px)!important}
        html.movx-v63 body[data-page="social"] .v63-selected-head__meta{grid-column:1!important;justify-self:start!important;padding-bottom:0!important}
        html.movx-v63 body[data-page="social"] #projectsList .project-entry{padding-top:68px!important;padding-bottom:68px!important}
        html.movx-v63 .case-viewer .case-slide-frame,
        html.movx-v63 .case-viewer .case-slide-frame img{transform:none!important;opacity:1!important;clip-path:none!important;-webkit-clip-path:none!important}
      }
      @media(prefers-reduced-motion:reduce){
        html.movx-v63 .case-viewer .case-slide-frame,
        html.movx-v63 .case-viewer .case-slide-frame img{transform:none!important;opacity:1!important;clip-path:none!important;-webkit-clip-path:none!important;transition:none!important}
      }
    `;
    document.head.appendChild(style);
  }

  if(section&&list){
    let head=section.querySelector('.v63-selected-head');
    if(!head){
      head=document.createElement('header');
      head.className='container v63-selected-head';
      head.innerHTML='<h2 id="v63SelectedTitle">Casos selecionados</h2><div class="v63-selected-head__meta" aria-hidden="true"><span>04</span><i></i><span class="v63-selected-count">00</span></div>';
      section.insertBefore(head,list);
      section.setAttribute('aria-labelledby','v63SelectedTitle');
    }
    const title=head.querySelector('h2');
    const count=head.querySelector('.v63-selected-count');
    const syncTitle=()=>{if(title)title.textContent=(sourceLabel?.textContent||'Casos selecionados').trim()||'Casos selecionados';};
    const syncCount=()=>{if(count)count.textContent=String(list.querySelectorAll('.project-entry').length).padStart(2,'0');};
    syncTitle();syncCount();
    if('MutationObserver'in window){
      if(sourceLabel)new MutationObserver(syncTitle).observe(sourceLabel,{subtree:true,childList:true,characterData:true});
      new MutationObserver(()=>requestAnimationFrame(syncCount)).observe(list,{childList:true,subtree:false});
    }
  }

  if(viewer){
    const staged=new WeakSet();
    const observer=!reduced&&'IntersectionObserver'in window?new IntersectionObserver(entries=>{
      entries.forEach(entry=>{
        if(!entry.isIntersecting)return;
        entry.target.classList.add('v63-case-in');
        observer.unobserve(entry.target);
      });
    },{threshold:.08,root:viewer,rootMargin:'10% 0px 10% 0px'}):null;

    const registerSlides=()=>{
      [...viewer.querySelectorAll('.case-slide-frame')].forEach(frame=>{
        if(staged.has(frame))return;
        staged.add(frame);frame.classList.add('v63-case-stage');
        if(reduced||!observer){frame.classList.add('v63-case-in');return;}
        const r=frame.getBoundingClientRect();
        if(viewer.classList.contains('open')&&r.bottom>0&&r.top<innerHeight*.94)frame.classList.add('v63-case-in');
        else observer.observe(frame);
      });
    };
    registerSlides();
    if('MutationObserver'in window)new MutationObserver(()=>requestAnimationFrame(registerSlides)).observe(viewer,{childList:true,subtree:true});
  }
})();

/* MOVX v64 — directory filter continuity
   Replaces the old whole-grid flash with a staggered artwork settle after filter changes. */
(() => {
  'use strict';
  const root=document.documentElement;
  const grid=document.getElementById('archiveGrid');
  const status=document.getElementById('archiveFilterStatus');
  const reduced=new URLSearchParams(location.search).has('static')||matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(!grid)return;

  root.classList.add('movx-v64');
  root.dataset.movxDirectoryMotion='v64-continuous-filtering';

  if(!document.getElementById('movx-v64-directory-style')){
    const style=document.createElement('style');
    style.id='movx-v64-directory-style';
    style.textContent=`
      html.movx-v64 body[data-page="social"] #archiveGrid.v37-grid-updating{opacity:1!important}
      html.movx-v64 body[data-page="social"] #archiveGrid .archive-card{
        transition:opacity .72s cubic-bezier(.4,0,.2,1),translate .86s cubic-bezier(.16,1,.3,1),filter .78s cubic-bezier(.4,0,.2,1)!important;
        transition-delay:calc(var(--v64-order,0) * 38ms)!important
      }
      html.movx-v64 body[data-page="social"] #archiveGrid.v64-filter-settling .archive-card{
        opacity:.28!important;translate:0 12px;filter:saturate(.88) contrast(.99)
      }
      html.movx-v64 body[data-page="social"] #archiveGrid.v64-filter-settling.v64-filter-ready .archive-card{
        opacity:1!important;translate:0 0;filter:none
      }
      html.movx-v64 body[data-page="social"] #archiveFilterStatus{
        transition:opacity .42s ease,translate .66s cubic-bezier(.16,1,.3,1)!important
      }
      html.movx-v64 body[data-page="social"] #archiveFilterStatus.v64-status-settle{opacity:.38!important;translate:0 5px}
      html.movx-v64 body[data-page="social"] #filterBoard .archive-filter{
        transition:opacity .48s ease,color .48s ease!important
      }
      html.movx-v64 body[data-page="social"] #filterBoard .archive-filter:not(.active):hover{opacity:.72}
      @media(max-width:680px){
        html.movx-v64 body[data-page="social"] #archiveGrid.v64-filter-settling .archive-card{translate:0 7px}
      }
      @media(prefers-reduced-motion:reduce){
        html.movx-v64 body[data-page="social"] #archiveGrid .archive-card,
        html.movx-v64 body[data-page="social"] #archiveFilterStatus{transition:none!important;translate:none!important;filter:none!important;opacity:1!important}
      }
    `;
    document.head.appendChild(style);
  }

  let token=0;
  const settle=()=>{
    const current=++token;
    [...grid.querySelectorAll('.archive-card')].forEach((card,index)=>card.style.setProperty('--v64-order',String(Math.min(index,8))));
    if(reduced)return;
    grid.classList.remove('v64-filter-ready');
    grid.classList.add('v64-filter-settling');
    requestAnimationFrame(()=>requestAnimationFrame(()=>{
      if(current!==token)return;
      grid.classList.add('v64-filter-ready');
      setTimeout(()=>{
        if(current!==token)return;
        grid.classList.remove('v64-filter-settling','v64-filter-ready');
      },1050);
    }));
  };

  [...grid.querySelectorAll('.archive-card')].forEach((card,index)=>card.style.setProperty('--v64-order',String(Math.min(index,8))));
  if('MutationObserver'in window){
    new MutationObserver(mutations=>{
      if(mutations.some(m=>m.type==='childList'))settle();
    }).observe(grid,{childList:true});
    if(status)new MutationObserver(()=>{
      if(reduced)return;
      status.classList.remove('v64-status-settle');
      status.classList.add('v64-status-settle');
      requestAnimationFrame(()=>requestAnimationFrame(()=>status.classList.remove('v64-status-settle')));
    }).observe(status,{childList:true,characterData:true,subtree:true});
  }
})();
