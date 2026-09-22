/* MOVX v101 — artwork-driven chapter, sharing the single motion clock. */
const root=document.documentElement;
root.classList.add('movx-v52','v52-fallback','v91-runtime-retired');
root.dataset.movxProcessArchitecture='v101-artwork-story';
const services=document.querySelector('#services');
const all=window.MOVX_PROJECTS||[];
const works=['motionhub','hardwork-thermo-plus','voltara-operacoes'].map(slug=>all.find(p=>p.slug===slug)).filter(Boolean);
const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const copy={
 pt:['DIREÇÃO EM PRÁTICA','Uma direção<br>Vários universos','Marca, imagem e composição em três projetos do arquivo','Abrir caso'],
 en:['ART DIRECTION IN PRACTICE','One approach<br>Different worlds','Brand, imagery and composition across three selected projects','Open case'],
 es:['DIRECCIÓN EN PRÁCTICA','Una dirección<br>Varios universos','Marca, imagen y composición en tres proyectos del archivo','Abrir caso']
};
if(services&&works.length&&!document.querySelector('#studioStudy')){
 const section=document.createElement('section');
 section.id='studioStudy';section.className='v52-architecture-section';section.setAttribute('aria-labelledby','studioTitle');
 section.innerHTML=`<div class="container studio-layout"><header class="studio-copy"><div class="studio-kicker"></div><h2 id="studioTitle"></h2><p></p></header><div class="studio-gallery">${works.map((p,i)=>`<button type="button" class="studio-work" data-open-project="${escape(p.slug)}" style="--work-index:${i}"><img src="${escape(p.cover)}" width="800" height="1000" alt="${escape(p.client+' — '+p.title)}" loading="lazy" decoding="async"><span>${escape(p.client)}</span></button>`).join('')}</div></div>`;
 services.insertAdjacentElement('afterend',section);
 const localize=()=>{
  const lang=(root.lang||'pt').slice(0,2);const c=copy[lang]||copy.pt;
  section.querySelector('.studio-kicker').textContent=c[0];
  section.querySelector('h2').innerHTML=c[1];section.querySelector('.studio-copy p').textContent=c[2];
  section.querySelectorAll('button').forEach((button,i)=>button.setAttribute('aria-label',`${c[3]} ${works[i].client} — ${works[i].title}`));
 };
 localize();
 const languageObserver=new MutationObserver(localize);languageObserver.observe(root,{attributes:true,attributeFilter:['lang']});
 const bridge=window.MOVX_MOTION_BRIDGE;
 bridge?.registerStage('workshop',section);
 const desktop=matchMedia('(min-width:981px)');
 bridge?.subscribe(snapshot=>{
  const state=snapshot.stages.find(s=>s.key==='workshop');if(!state)return;
  const enabled=desktop.matches&&!snapshot.reducedMotion;
  // Only the artwork planes move. Heading and captions retain their reading geometry.
  const depth=enabled?Math.max(0,Math.min(1,(.65-state.progress)*2.4)):0;
  section.style.setProperty('--studio-depth',depth.toFixed(4));
  section.dataset.motion=enabled?'spatial':'static';
 });
}
