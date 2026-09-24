/* MOVX v135 — approved Archive / Services / About runtime.
   The existing cover/hero and Scroll World are explicitly protected.
   A future fluid 3D hero object will be installed only when its asset is ready. */

const root=document.documentElement;
const body=document.body;
const q=(s,c=document)=>c.querySelector(s);
const qa=(s,c=document)=>[...c.querySelectorAll(s)];
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const fine=matchMedia('(pointer:fine)').matches;
const clamp=(v,a=0,b=1)=>Math.min(b,Math.max(a,v));

root.classList.add('movx-v135');
root.dataset.movxV135='approved-redesign';
root.dataset.v135FluidHero='reserved-no-asset';

const COPY={
  pt:{
    archiveKicker:'PROJETOS / ARQUIVO',
    archiveTitle:'Arquivo vivo<br>de projetos<span class="v135-accent">.</span>',
    archiveIntro:'Ideias, marcas e pessoas em movimento. Explore os projetos como um arquivo visual vivo: direção, contexto, formato e execução em um mesmo sistema.',
    servicesKicker:'SERVIÇOS / O QUE FAZEMOS',
    servicesTitle:'Estrutura criativa em<br>estado <span class="v135-accent">sólido.</span>',
    servicesIntro:'Design, motion, som, estratégia e produção integrados para transformar ideias em experiências visuais que geram presença, conexão e resultado.',
    aboutKicker:'SOBRE NÓS / MANIFESTO',
    aboutTitle:'Movimento é feito por<em>pessoas<span class="v135-dot">.</span></em>',
    aboutLead:'A MOVX conecta estratégia, design, motion, som, inteligência artificial e tecnologia para transformar ideias em experiências visuais reais — com direção clara, execução precisa e propósito.',
    pillars:[['01','Pessoas','O centro de tudo que criamos.'],['02','Criatividade','Ideias que ganham movimento.'],['03','Resultados','Experiências com impacto real.']]
  },
  en:{
    archiveKicker:'PROJECTS / ARCHIVE',
    archiveTitle:'A living archive<br>of projects<span class="v135-accent">.</span>',
    archiveIntro:'Ideas, brands and people in motion. Explore projects as a living visual archive: direction, context, format and execution inside one system.',
    servicesKicker:'SERVICES / WHAT WE DO',
    servicesTitle:'Creative structure in<br><span class="v135-accent">solid form.</span>',
    servicesIntro:'Design, motion, sound, strategy and production integrated to turn ideas into visual experiences that create presence, connection and results.',
    aboutKicker:'ABOUT / MANIFESTO',
    aboutTitle:'Movement is made by<em>people<span class="v135-dot">.</span></em>',
    aboutLead:'MOVX connects strategy, design, motion, sound, artificial intelligence and technology to turn ideas into real visual experiences — with clear direction, precise execution and purpose.',
    pillars:[['01','People','At the center of everything we create.'],['02','Creativity','Ideas that gain movement.'],['03','Results','Experiences with real impact.']]
  },
  es:{
    archiveKicker:'PROYECTOS / ARCHIVO',
    archiveTitle:'Archivo vivo<br>de proyectos<span class="v135-accent">.</span>',
    archiveIntro:'Ideas, marcas y personas en movimiento. Explora los proyectos como un archivo visual vivo: dirección, contexto, formato y ejecución dentro de un mismo sistema.',
    servicesKicker:'SERVICIOS / LO QUE HACEMOS',
    servicesTitle:'Estructura creativa en<br>estado <span class="v135-accent">sólido.</span>',
    servicesIntro:'Diseño, motion, sonido, estrategia y producción integrados para transformar ideas en experiencias visuales que generan presencia, conexión y resultado.',
    aboutKicker:'SOBRE / MANIFIESTO',
    aboutTitle:'El movimiento lo hacen las<em>personas<span class="v135-dot">.</span></em>',
    aboutLead:'MOVX conecta estrategia, diseño, motion, sonido, inteligencia artificial y tecnología para transformar ideas en experiencias visuales reales — con dirección clara, ejecución precisa y propósito.',
    pillars:[['01','Personas','El centro de todo lo que creamos.'],['02','Creatividad','Ideas que ganan movimiento.'],['03','Resultados','Experiencias con impacto real.']]
  }
};

function lang(){
  try{const saved=localStorage.getItem('movx-lang');if(['pt','en','es'].includes(saved))return saved}catch{}
  const code=(root.lang||'pt').slice(0,2).toLowerCase();
  return ['pt','en','es'].includes(code)?code:'pt';
}

function setKicker(section,text){
  const kicker=q('.kicker',section);if(kicker)kicker.textContent=text;
}

function decorateArchive(){
  const section=q('#archiveControls');
  if(!section)return;
  section.classList.add('v135-archive');
  if(!q('.v135-archive-preview',section)){
    const projects=Array.isArray(window.MOVX_PROJECTS)?window.MOVX_PROJECTS:[];
    const preferred=['hardwork-thermo-plus','voltara-operacoes','marina-gengival'];
    const chosen=preferred.map(slug=>projects.find(p=>p.slug===slug)).filter(Boolean);
    while(chosen.length<3&&projects[chosen.length])chosen.push(projects[chosen.length]);
    if(chosen.length){
      const preview=document.createElement('div');
      preview.className='v135-archive-preview';
      preview.setAttribute('aria-label','MOVX project archive preview');
      preview.innerHTML=chosen.slice(0,3).map((project,index)=>{
        const title=project.title||project.client||'MOVX';
        return `<article class="v135-archive-preview__item" data-v135-preview="${index+1}">
          <img src="${project.cover}" alt="${project.client||'MOVX'} — ${title}" loading="lazy" decoding="async">
          <div class="v135-archive-preview__meta"><strong>${title}</strong><span>${String(index+1).padStart(2,'0')}</span></div>
        </article>`;
      }).join('');
      const head=q('.archive-head',section);
      head?.insertAdjacentElement('afterend',preview);
    }
  }
  root.dataset.v135Archive='living-project-archive';
}

function serviceObjectMarkup(){
  return `<div class="v135-service-visual" aria-hidden="true">
    <div class="v135-service-object">
      <svg viewBox="0 0 900 700" role="presentation">
        <defs>
          <linearGradient id="v135Chrome" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stop-color="#111"/>
            <stop offset=".16" stop-color="#fafafa"/>
            <stop offset=".31" stop-color="#5c5c5c"/>
            <stop offset=".48" stop-color="#080808"/>
            <stop offset=".67" stop-color="#d8d8d8"/>
            <stop offset=".82" stop-color="#2a2a2a"/>
            <stop offset="1" stop-color="#f8f8f8"/>
          </linearGradient>
          <linearGradient id="v135Edge" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stop-color="#511508"/>
            <stop offset=".5" stop-color="#ff5b1f"/>
            <stop offset="1" stop-color="#ff9a58"/>
          </linearGradient>
          <radialGradient id="v135Core" cx="50%" cy="50%" r="50%">
            <stop offset="0" stop-color="#ff9a58" stop-opacity=".94"/>
            <stop offset=".35" stop-color="#ff5b1f" stop-opacity=".78"/>
            <stop offset="1" stop-color="#ff5b1f" stop-opacity="0"/>
          </radialGradient>
          <filter id="v135Soft" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="8"/>
          </filter>
        </defs>
        <g class="v135-loop v135-loop--a">
          <ellipse cx="450" cy="350" rx="312" ry="164" fill="none" stroke="url(#v135Chrome)" stroke-width="58"/>
          <ellipse cx="450" cy="350" rx="313" ry="165" fill="none" stroke="url(#v135Edge)" stroke-width="5" opacity=".8"/>
        </g>
        <g class="v135-loop v135-loop--b">
          <ellipse cx="450" cy="350" rx="300" ry="156" fill="none" stroke="url(#v135Chrome)" stroke-width="50"/>
          <ellipse cx="450" cy="350" rx="301" ry="157" fill="none" stroke="url(#v135Edge)" stroke-width="4" opacity=".72"/>
        </g>
        <g class="v135-loop v135-loop--c">
          <ellipse cx="450" cy="350" rx="294" ry="152" fill="none" stroke="url(#v135Chrome)" stroke-width="44"/>
          <ellipse cx="450" cy="350" rx="295" ry="153" fill="none" stroke="url(#v135Edge)" stroke-width="4" opacity=".6"/>
        </g>
        <circle class="v135-core" cx="450" cy="350" r="92" fill="url(#v135Core)" filter="url(#v135Soft)" opacity=".42"/>
      </svg>
    </div>
    <div class="v135-service-label">DESIGN / MOTION / SOUND / STRATEGY</div>
  </div>`;
}

function decorateServices(){
  const section=q('#services');if(!section)return;
  const container=q(':scope > .container',section)||q('.container',section);if(!container)return;
  if(!q('.v135-service-visual',section)){
    const intro=q('.section-intro',section);
    intro?.insertAdjacentHTML('afterend',serviceObjectMarkup());
  }
  root.dataset.v135Services='chrome-object';
}

function decorateAbout(){
  const section=q('#about');if(!section)return;
  const copy=q('.about-copy',section);if(!copy)return;
  if(!q('.v135-about-pillars',section)){
    const wrap=document.createElement('div');
    wrap.className='v135-about-pillars';
    copy.appendChild(wrap);
  }
  root.dataset.v135About='human-manifesto-lite';
}

function applyCopy(){
  const l=lang();const copy=COPY[l];
  const archive=q('#archiveControls');
  if(archive){
    setKicker(archive,copy.archiveKicker);
    const title=q('.archive-head h2',archive);if(title)title.innerHTML=copy.archiveTitle;
    const intro=q('.archive-head>p',archive);if(intro)intro.textContent=copy.archiveIntro;
  }
  const services=q('#services');
  if(services){
    setKicker(services,copy.servicesKicker);
    const title=q('.section-intro h2',services);if(title)title.innerHTML=copy.servicesTitle;
    const intro=q('.section-intro>p',services);if(intro)intro.textContent=copy.servicesIntro;
  }
  const about=q('#about');
  if(about){
    setKicker(about,copy.aboutKicker);
    const title=q('.about-heading h2',about);if(title)title.innerHTML=copy.aboutTitle;
    const lead=q('.about-copy .about-lead',about);if(lead)lead.textContent=copy.aboutLead;
    const wrap=q('.v135-about-pillars',about);
    if(wrap)wrap.innerHTML=copy.pillars.map(([n,title,text])=>`<article class="v135-about-pillar"><span>${n}</span><strong>${title}</strong><small>${text}</small></article>`).join('');
  }
}

function sectionProgress(el){
  if(!el)return 0;const r=el.getBoundingClientRect();
  return clamp((innerHeight-r.top)/(innerHeight+r.height));
}

function setupMotion(){
  const archive=q('#archiveControls');
  const services=q('#services');
  const object=q('.v135-service-object',services);
  let pointerX=0,pointerY=0,raf=0;
  const render=()=>{
    raf=0;
    if(archive&&!reduced){
      const p=sectionProgress(archive);
      qa('.v135-archive-preview__item',archive).forEach((item,index)=>{
        item.style.setProperty('--v135-preview-y',`${((p-.5)*(index%2?22:-18)).toFixed(1)}px`);
      });
    }
    if(services&&object&&!reduced){
      const p=sectionProgress(services);
      services.style.setProperty('--v135-service-y',`${((p-.5)*-34).toFixed(1)}px`);
      services.style.setProperty('--v135-service-rx',`${((p-.5)*7 + pointerY*3).toFixed(2)}deg`);
      services.style.setProperty('--v135-service-ry',`${((p-.5)*-13 + pointerX*6).toFixed(2)}deg`);
      services.style.setProperty('--v135-service-rz',`${(-7 + p*7).toFixed(2)}deg`);
    }
  };
  const schedule=()=>{if(!raf)raf=requestAnimationFrame(render)};
  addEventListener('scroll',schedule,{passive:true});
  addEventListener('resize',schedule,{passive:true});
  if(services&&fine&&!reduced){
    services.addEventListener('pointermove',event=>{
      const r=services.getBoundingClientRect();
      pointerX=clamp((event.clientX-r.left)/Math.max(1,r.width),0,1)-.5;
      pointerY=clamp((event.clientY-r.top)/Math.max(1,r.height),0,1)-.5;
      schedule();
    });
    services.addEventListener('pointerleave',()=>{pointerX=0;pointerY=0;schedule()});
  }
  render();
}

if(body?.dataset.page==='social'){
  decorateArchive();
  decorateServices();
  decorateAbout();
  applyCopy();
  setupMotion();
  document.addEventListener('click',event=>{
    if(event.target.closest?.('[data-lang]'))setTimeout(applyCopy,40);
  });
}
