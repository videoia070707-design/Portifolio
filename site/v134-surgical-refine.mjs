/* MOVX v134 — surgical tech/Y2K refinement runtime.
   Intentionally scoped to About, Services, Contact and footer navigation. */
const root=document.documentElement;
const body=document.body;
const q=(s,c=document)=>c.querySelector(s);
const qa=(s,c=document)=>[...c.querySelectorAll(s)];
const clamp=(v,a=0,b=1)=>Math.min(b,Math.max(a,v));
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;

root.classList.add('movx-v134');
root.dataset.movxV134='surgical-tech-refine';

const COPY={
  pt:{
    service4:'Produção audiovisual',
    service4Text:'Captação, edição, direção visual, motion e sound design para construir peças audiovisuais pensadas para campanha, conteúdo e marca.',
    contactText:'Se o projeto pede mais do que uma peça bonita — campanha, sistema visual, social, vídeo, website ou produção audiovisual — este formulário monta um briefing curto para iniciar a conversa.',
    production:'Produção audiovisual',website:'Website / UI/UX',ai:'AI Creator'
  },
  en:{
    service4:'Audiovisual production',
    service4Text:'Capture, editing, visual direction, motion and sound design for audiovisual pieces built for campaigns, content and brands.',
    contactText:'If the project needs more than a beautiful asset — campaign, visual system, social, video, website or audiovisual production — this form creates a short brief to start the conversation.',
    production:'Audiovisual production',website:'Website / UI/UX',ai:'AI Creator'
  },
  es:{
    service4:'Producción audiovisual',
    service4Text:'Captura, edición, dirección visual, motion y diseño sonoro para piezas audiovisuales pensadas para campañas, contenido y marca.',
    contactText:'Si el proyecto necesita más que una pieza bonita — campaña, sistema visual, social, vídeo, sitio web o producción audiovisual — este formulario crea un briefing breve para iniciar la conversación.',
    production:'Producción audiovisual',website:'Website / UI/UX',ai:'AI Creator'
  }
};

function lang(){
  try{const saved=localStorage.getItem('movx-lang');if(['pt','en','es'].includes(saved))return saved}catch{}
  const code=(root.lang||'pt').slice(0,2).toLowerCase();
  return ['pt','en','es'].includes(code)?code:'pt';
}
function base(key,l=lang()){
  const dict=window.MOVX_I18N?.ui?.[l]||window.MOVX_I18N?.ui?.pt||{};
  return dict[key]||key;
}
function patchI18n(){
  const ui=window.MOVX_I18N?.ui;
  if(!ui)return;
  ['pt','en','es'].forEach(l=>{
    if(!ui[l])return;
    ui[l]['home.service4']=COPY[l].service4;
    ui[l]['home.service4Text']=COPY[l].service4Text;
    ui[l]['home.contactText']=COPY[l].contactText;
    ui[l]['contact.option.production']=COPY[l].production;
    ui[l]['contact.option.website']=COPY[l].website;
    ui[l]['contact.option.ai']=COPY[l].ai;
  });
}
function applyCopy(){
  patchI18n();
  const l=lang(),copy=COPY[l];
  const service=q('[data-i18n="home.service4"]');if(service)service.textContent=copy.service4;
  const serviceText=q('[data-i18n="home.service4Text"]');if(serviceText)serviceText.textContent=copy.service4Text;
  const contactText=q('[data-i18n="home.contactText"]');if(contactText)contactText.textContent=copy.contactText;
  const select=q('#contact select[name="project"]');
  if(select){
    const keys=['social','direction','video','production','website','ai','other'];
    const labelFor=key=>key==='production'?copy.production:key==='website'?copy.website:key==='ai'?copy.ai:base(`contact.option.${key}`,l);
    const selected=select.selectedIndex>=0?select.options[select.selectedIndex]?.dataset?.v134Key:null;
    select.innerHTML=keys.map(key=>`<option data-v134-key="${key}">${labelFor(key)}</option>`).join('');
    const idx=keys.indexOf(selected);if(idx>=0)select.selectedIndex=idx;
  }
  root.dataset.v134Copy='audiovisual-web';
}

function makeAboutSignal(){
  const section=q('#about');if(!section||q('.v134-signal-field',section))return;
  const layer=document.createElement('div');
  layer.className='v134-signal-field';layer.setAttribute('aria-hidden','true');
  layer.innerHTML=`<svg viewBox="0 0 900 600" preserveAspectRatio="none">
    <path class="is-ink" d="M10 445 C155 306 260 105 468 160 S742 382 904 84"/>
    <path class="is-ink" d="M-28 502 C128 382 238 244 416 276 S690 410 928 210"/>
    <path class="is-accent" d="M46 366 C182 234 306 205 456 242 S704 308 890 142"/>
    <path class="is-ink" d="M90 560 C246 426 318 362 510 354 S760 432 936 326"/>
    <path class="is-ink" d="M214 46 C334 112 362 212 518 220 S774 112 940 28"/>
  </svg><i class="v134-signal-node"></i>`;
  section.prepend(layer);
  qa('path',layer).forEach((path,index)=>{
    const length=path.getTotalLength?.()||900;
    path.style.strokeDasharray=`${length.toFixed(1)} ${length.toFixed(1)}`;
    path.dataset.v134Length=String(length);
    path.style.strokeDashoffset=String(length*(.24+index*.035));
  });
  root.dataset.v134About='signal-field';
}
function makeServicesSignal(){
  const section=q('#services');if(!section||q('.v134-services-signal',section))return;
  const layer=document.createElement('div');
  layer.className='v134-services-signal';layer.setAttribute('aria-hidden','true');
  layer.innerHTML=`<div class="v134-services-signal__head"><span>SIGNAL / SERVICES</span><span class="v134-services-signal__count">01 / 04</span></div>
  <svg viewBox="0 0 560 560" preserveAspectRatio="none">
    <path data-signal="1" d="M10 86 C140 14 212 166 332 84 S474 42 552 86"/>
    <path data-signal="2" d="M10 208 C118 300 220 126 340 218 S474 292 552 208"/>
    <path data-signal="3" d="M10 340 C118 256 214 438 344 342 S476 286 552 340"/>
    <path data-signal="4" d="M10 470 C142 548 228 390 354 470 S482 528 552 470"/>
  </svg><i class="v134-services-signal__cursor"></i>`;
  section.prepend(layer);
  root.dataset.v134Services='signal-map';
}
function sectionProgress(el){
  if(!el)return 0;const r=el.getBoundingClientRect();
  return clamp((innerHeight-r.top)/(innerHeight+r.height));
}
function setupMotion(){
  const about=q('#about'),services=q('#services');
  const serviceRows=services?qa('.service-row',services):[];
  let raf=0,disposed=false;
  const render=()=>{
    raf=0;if(disposed)return;
    if(about){
      const p=sectionProgress(about),layer=q('.v134-signal-field',about);
      about.style.setProperty('--v134-about-x',`${((p-.5)*-18).toFixed(2)}px`);
      about.style.setProperty('--v134-about-y',`${((p-.5)*14).toFixed(2)}px`);
      about.style.setProperty('--v134-about-r',`${((p-.5)*1.4).toFixed(3)}deg`);
      about.style.setProperty('--v134-about-s',(1+p*.018).toFixed(4));
      about.style.setProperty('--v134-about-node-y',`${((p-.5)*54).toFixed(1)}px`);
      if(layer&&!reduced)qa('path',layer).forEach((path,index)=>{
        const length=Number(path.dataset.v134Length)||900;
        path.style.strokeDashoffset=String(length*(.30-p*.26+index*.018));
      });
    }
    if(services&&serviceRows.length){
      const p=sectionProgress(services),active=Math.min(serviceRows.length-1,Math.max(0,Math.round(p*(serviceRows.length-1))));
      const layer=q('.v134-services-signal',services);
      qa('path',layer).forEach((path,index)=>path.classList.toggle('is-active',index===active));
      const count=q('.v134-services-signal__count',services);if(count)count.textContent=`${String(active+1).padStart(2,'0')} / ${String(serviceRows.length).padStart(2,'0')}`;
      services.style.setProperty('--v134-service-cursor',`${serviceRows.length>1?(active/(serviceRows.length-1))*100:0}%`);
      root.dataset.v134Service=String(active+1);
    }
  };
  const schedule=()=>{if(!raf)raf=requestAnimationFrame(render)};
  addEventListener('scroll',schedule,{passive:true});addEventListener('resize',schedule,{passive:true});
  window.MOVX_MOTION_BRIDGE?.subscribe?.(render);render();
  addEventListener('pagehide',()=>{disposed=true;if(raf)cancelAnimationFrame(raf)},{once:true});
}

if(body?.dataset.page==='social'){
  patchI18n();makeAboutSignal();makeServicesSignal();applyCopy();setupMotion();
  document.addEventListener('click',event=>{if(event.target.closest?.('[data-lang]'))setTimeout(applyCopy,20)});
}
root.dataset.v134Footer='four-up-desktop';
