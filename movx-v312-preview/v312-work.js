(()=>{
 const q=(s,r=document)=>r.querySelector(s),qa=(s,r=document)=>[...r.querySelectorAll(s)],clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v)),pad=n=>String(n).padStart(2,'0');
 const projects=[
  {slug:'hardwork-thermo-plus',client:'Hardwork',title:'Thermo+ Product Campaign',meta:'PRODUCT / 3D / SOCIAL DESIGN',cover:'../assets/projects/hardwork-thermo-plus/hardwork-thermo-plus-01.webp',slides:Array.from({length:6},(_,i)=>`../assets/projects/hardwork-thermo-plus/hardwork-thermo-plus-${pad(i+1)}.webp`)},
  {slug:'voltara-operacoes',client:'Voltara Energia',title:'Operações de Alto Desempenho',meta:'B2B / ENERGY / SOCIAL DESIGN',cover:'../assets/projects/voltara-operacoes/slide-01.webp',slides:Array.from({length:6},(_,i)=>`../assets/projects/voltara-operacoes/slide-${pad(i+1)}.webp`)},
  {slug:'belive-cashflow',client:'Belive',title:'Cashflow Intelligence',meta:'FINANCE / 3D / SOCIAL DESIGN',cover:'../assets/projects/belive-cashflow.webp',slides:['../assets/projects/belive-cashflow.webp','../assets/projects/belive-02.webp','../assets/projects/belive-03.webp','../assets/projects/belive-04.webp','../assets/projects/belive-05.webp','../assets/projects/belive-01.webp']},
  {slug:'motionhub',client:'MotionHub',title:'Product Storytelling',meta:'SAAS / PRODUCT / CAMPAIGN',cover:'../assets/projects/motionhub-01.webp',slides:Array.from({length:6},(_,i)=>`../assets/projects/motionhub-${pad(i+1)}.webp`)},
  {slug:'marina-gengival',client:'Dra. Marina Alves',title:'Sorriso Gengival',meta:'HEALTHCARE / CAROUSEL / SOCIAL',cover:'../assets/projects/marina-gengival/01.webp',slides:Array.from({length:5},(_,i)=>`../assets/projects/marina-gengival/${pad(i+1)}.webp`)},
  {slug:'hardwork-modo',client:'Hardwork',title:'Modo Hardwork',meta:'CHARACTER / CAMPAIGN / 3D',cover:'../assets/projects/hardwork-modo/hardwork-modo-01.webp',slides:Array.from({length:7},(_,i)=>`../assets/projects/hardwork-modo/hardwork-modo-${pad(i+1)}.webp`)},
  {slug:'marina-familia',client:'Dra. Marina Alves',title:'Cuidar Cedo',meta:'FAMILY CARE / CAROUSEL / SOCIAL',cover:'../assets/projects/marina-familia/01.webp',slides:Array.from({length:3},(_,i)=>`../assets/projects/marina-familia/${pad(i+1)}.webp`)},
  {slug:'voltara-vantagem',client:'Voltara Energia',title:'Vantagem Operacional',meta:'B2B / CAROUSEL / ENERGY',cover:'../assets/projects/voltara-vantagem/slide-01.webp',slides:Array.from({length:6},(_,i)=>`../assets/projects/voltara-vantagem/slide-${pad(i+1)}.webp`)},
  {slug:'voltara-viabilidade',client:'Voltara Energia',title:'Viabilidade Solar',meta:'ENERGY / CAROUSEL / B2B',cover:'../assets/projects/voltara-viabilidade/voltara-viabilidade-01.webp',slides:Array.from({length:6},(_,i)=>`../assets/projects/voltara-viabilidade/voltara-viabilidade-${pad(i+1)}.webp`)},
  {slug:'voltara-confianca-escala',client:'Voltara Energia',title:'Confiança & Escala',meta:'BRAND SYSTEM / ENERGY / SOCIAL',cover:'../assets/projects/voltara-confianca-escala/slide-01.webp',slides:Array.from({length:6},(_,i)=>`../assets/projects/voltara-confianca-escala/slide-${pad(i+1)}.webp`)},
  {slug:'voltara-engenharia-aplicada',client:'Voltara Energia',title:'Engenharia Aplicada',meta:'INDUSTRIAL / ENERGY / CAROUSEL',cover:'../assets/projects/voltara-engenharia-aplicada/slide-01.webp',slides:Array.from({length:4},(_,i)=>`../assets/projects/voltara-engenharia-aplicada/slide-${pad(i+1)}.webp`)},
  {slug:'voltara-infraestrutura',client:'Voltara Energia',title:'Infraestrutura Solar Corporativa',meta:'CORPORATE / ENERGY / SOCIAL',cover:'../assets/projects/voltara-infraestrutura/slide-01.webp',slides:Array.from({length:3},(_,i)=>`../assets/projects/voltara-infraestrutura/slide-${pad(i+1)}.webp`)},
  {slug:'hardwork-neon-direction',client:'Hardwork',title:'Neon Direction',meta:'ART DIRECTION / CAMPAIGN / SOCIAL',cover:'../assets/projects/hardwork-neon-direction/slide-01.webp',slides:Array.from({length:3},(_,i)=>`../assets/projects/hardwork-neon-direction/slide-${pad(i+1)}.webp`)}
 ];
 const work=q('.work312'),viewport=q('[data-work-viewport]'),track=q('[data-work-track]'),indexEl=q('[data-work-index]'),totalEl=q('[data-work-total]'),meter=q('[data-work-meter]');
 if(!work||!viewport||!track)return;
 totalEl.textContent=pad(projects.length);
 work.style.height=`${Math.max(640,projects.length*62)}vh`;
 track.innerHTML=projects.map((p,i)=>`<button class="case-card${i===0?' is-active':''}" type="button" data-case="${p.slug}" aria-label="Abrir case ${p.title}"><div class="case-media"><img src="${p.cover}" alt="${p.title} — ${p.client}" ${i<2?'fetchpriority="high"':'loading="lazy"'} decoding="async"></div><div class="case-meta"><span class="case-index">${pad(i+1)}</span><div><strong>${p.title}</strong><small>${p.client} / ${p.slides.length} ARTES</small></div><em>${p.meta}</em></div></button>`).join('');
 const cards=qa('.case-card',track);
 let start=0,range=1,maxX=0,target=0,current=0,raf=0,lastIdx=-1;
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 function measure(){start=work.offsetTop;range=Math.max(1,work.offsetHeight-innerHeight);maxX=Math.max(0,track.scrollWidth-viewport.clientWidth);sync(true)}
 function sync(force=false){target=clamp((scrollY-start)/range);if(reduced){current=target;paint()}else if(!raf||force){if(force&&Math.abs(current-target)>.6)current=target;raf=requestAnimationFrame(tick)}}
 function tick(){raf=0;current+=(target-current)*.11;if(Math.abs(target-current)<.00025)current=target;paint();if(Math.abs(target-current)>.00025)raf=requestAnimationFrame(tick)}
 function paint(){track.style.transform=`translate3d(${-current*maxX}px,0,0)`;meter.style.width=`${current*100}%`;const idx=Math.round(current*(cards.length-1));if(idx!==lastIdx){lastIdx=idx;cards.forEach((c,i)=>c.classList.toggle('is-active',i===idx));indexEl.textContent=pad(idx+1)}}
 addEventListener('scroll',()=>sync(),{passive:true});addEventListener('resize',()=>requestAnimationFrame(measure),{passive:true});new ResizeObserver(()=>measure()).observe(track);requestAnimationFrame(measure);
 const dialog=q('[data-case-dialog]'),title=q('[data-case-title]'),meta=q('[data-case-meta]'),gallery=q('[data-case-gallery]'),close=q('[data-case-close]');
 function openCase(slug){const p=projects.find(x=>x.slug===slug);if(!p||!dialog)return;title.textContent=p.title;meta.textContent=`${p.client} / ${p.meta} / ${p.slides.length} ARTES`;gallery.innerHTML=p.slides.map((src,i)=>`<figure class="case-art"><img src="${src}" alt="${p.title} — peça ${i+1}" loading="lazy" decoding="async"><figcaption>${pad(i+1)} / ${pad(p.slides.length)} — ${p.client}</figcaption></figure>`).join('');document.body.classList.add('case-open');dialog.showModal();setTimeout(()=>close?.focus(),0)}
 cards.forEach(c=>c.addEventListener('click',()=>openCase(c.dataset.case)));
 function shut(){if(dialog?.open)dialog.close();document.body.classList.remove('case-open');gallery.innerHTML=''}
 close?.addEventListener('click',shut);dialog?.addEventListener('click',e=>{if(e.target===dialog)shut()});dialog?.addEventListener('close',()=>{document.body.classList.remove('case-open');gallery.innerHTML=''})
})();
