/* MOVX v91 — static editorial archive deconstruction
   The v52 section remains because its authored DOM is part of the current site,
   but its historical GSAP/WebGL choreography is no longer visible after v83+.
   Production now builds only the semantic editorial composition. */

const root=document.documentElement;
root.classList.add('movx-v52','v52-fallback','v91-runtime-retired');
root.dataset.movxProcessArchitecture='v91-static-editorial';

function selectedProjects(){
  const all=Array.isArray(window.MOVX_PROJECTS)?window.MOVX_PROJECTS:[];
  const wanted=['motionhub','hardwork-thermo-plus','voltara-operacoes','belive-cashflow'];
  return wanted.map(slug=>all.find(p=>p.slug===slug)).filter(Boolean);
}
function escapeHTML(value=''){
  return String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
function makeSection(items){
  const services=document.querySelector('.services-section');
  if(!services||document.querySelector('.v52-architecture-section'))return document.querySelector('.v52-architecture-section');
  const section=document.createElement('section');
  section.className='v52-architecture-section v52-runtime-retired';
  section.innerHTML=`<div class="v52-architecture-sticky">
    <div class="v52-architecture-copy"><div class="v52-architecture-kicker">ARQUIVO / DECONSTRUÇÃO</div><h2>O trabalho vira sistema</h2><p>As peças deixam o arquivo e a própria caixa se transforma na estrutura espacial do processo</p></div>
    <div class="v52-mobile-artworks">${items.slice(0,3).map(p=>`<img src="${escapeHTML(p.cover)}" alt="${escapeHTML(p.client)} — ${escapeHTML(p.title)}" loading="lazy" decoding="async">`).join('')}</div>
  </div>`;
  services.insertAdjacentElement('afterend',section);
  return section;
}

makeSection(selectedProjects());
