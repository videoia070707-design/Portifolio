/* MOVX v110.1 — final Process legibility owner
   Legacy motion layers predate the current corridor and can leave inline/important
   coordinates or text-fill values behind. This small runtime owns only the calm
   reading lane; v108 continues to own scroll progress and WebGL. */

const root=document.documentElement;
const body=document.body;
const q=(s,c=document)=>c.querySelector(s);
const qa=(s,c=document)=>[...c.querySelectorAll(s)];
const reduced=new URLSearchParams(location.search).has('static')||matchMedia('(prefers-reduced-motion: reduce)').matches||root.dataset.movxReducedMotion==='true';
const desktop=matchMedia('(min-width:981px)').matches;

if(body?.dataset.page==='social'){
  const process=q('#process.process-section');
  const journey=q('.v55-process-journey',process||document);
  const grid=q('.container.process-grid',journey||document);
  const title=q('.process-title',grid||document);
  const h2=q('h2',title||document);
  const list=q('.process-list',grid||document);
  const rows=list?qa(':scope > li',list):[];

  const important=(el,property,value)=>el?.style.setProperty(property,value,'important');

  if(desktop&&!reduced&&process&&journey&&grid&&title&&h2&&list&&rows.length){
    root.dataset.movxV110='legibility-owner';

    // Force the sticky viewport geometry after every historical process layer.
    important(grid,'position','sticky');
    important(grid,'top','0px');
    important(grid,'height','100vh');
    important(grid,'min-height','100vh');
    important(grid,'max-height','100vh');
    important(grid,'overflow','hidden');
    important(grid,'transform','none');
    important(grid,'translate','none');

    important(title,'position','relative');
    important(title,'top','auto');
    important(title,'opacity','1');
    important(title,'visibility','visible');
    important(title,'transform','none');
    important(title,'translate','none');
    important(title,'filter','none');
    important(title,'clip-path','none');

    important(h2,'display','block');
    important(h2,'opacity','1');
    important(h2,'visibility','visible');
    important(h2,'color','var(--fg)');
    important(h2,'-webkit-text-fill-color','var(--fg)');
    important(h2,'transform','none');
    important(h2,'translate','none');
    important(h2,'filter','none');
    important(h2,'clip-path','none');

    // Anchor the list to the viewport-sticky container. Inline !important is
    // intentional here: it beats the retired top:50% process experiment.
    important(list,'position','absolute');
    important(list,'left','0px');
    important(list,'right','auto');
    important(list,'top','auto');
    important(list,'bottom','clamp(52px, 7vh, 78px)');
    important(list,'width','min(430px, 38vw)');
    important(list,'max-width','430px');
    important(list,'height','224px');
    important(list,'min-height','224px');
    important(list,'margin','0');
    important(list,'padding','0');
    important(list,'transform','none');
    important(list,'translate','none');

    rows.forEach(row=>{
      important(row,'position','absolute');
      important(row,'inset','0px');
      important(row,'top','0px');
      important(row,'right','0px');
      important(row,'bottom','auto');
      important(row,'left','0px');
      important(row,'width','100%');
      important(row,'height','auto');
      important(row,'min-height','0');
      important(row,'transform','none');
      important(row,'translate','none');
      important(row,'filter','none');
      important(row,'clip-path','none');

      const number=q(':scope > span',row);
      const strong=q('strong',row);
      const paragraph=q('p',row);
      const inner=q(':scope > div',row);
      [number,strong,paragraph,inner].forEach(el=>{
        important(el,'visibility','visible');
        important(el,'filter','none');
        important(el,'transform','none');
        important(el,'translate','none');
        important(el,'clip-path','none');
      });
      important(number,'color','var(--editorial-red)');
      important(number,'-webkit-text-fill-color','var(--editorial-red)');
      important(strong,'color','var(--fg)');
      important(strong,'-webkit-text-fill-color','var(--fg)');
      important(paragraph,'color','color-mix(in srgb,var(--fg) 74%,var(--bg))');
      important(paragraph,'-webkit-text-fill-color','color-mix(in srgb,var(--fg) 74%,var(--bg))');
    });

    // Re-assert theme-dependent fills if another layer changes the root theme.
    const themeObserver=new MutationObserver(()=>{
      important(h2,'color','var(--fg)');
      important(h2,'-webkit-text-fill-color','var(--fg)');
      rows.forEach(row=>{
        important(q('strong',row),'color','var(--fg)');
        important(q('strong',row),'-webkit-text-fill-color','var(--fg)');
        important(q('p',row),'color','color-mix(in srgb,var(--fg) 74%,var(--bg))');
        important(q('p',row),'-webkit-text-fill-color','color-mix(in srgb,var(--fg) 74%,var(--bg))');
      });
    });
    themeObserver.observe(root,{attributes:true,attributeFilter:['data-theme']});
    addEventListener('pagehide',()=>themeObserver.disconnect(),{once:true});
  }else if(process){
    root.dataset.movxV110=reduced?'reduced':'flow-fallback';
  }
}
