/* MOVX v74 — keyboard-complete project access
   Makes every authored project opener operable by keyboard without changing layout or copy. */
(()=>{
  'use strict';
  const root=document.documentElement;
  const viewer=document.getElementById('caseViewer');
  root.classList.add('movx-v74');
  root.dataset.movxRelease='v74-accessible-editorial';

  const naturalInteractive=el=>el.matches('a[href],button,input,select,textarea,summary,[contenteditable="true"]');
  const decorate=scope=>{
    const nodes=[];
    if(scope?.matches?.('[data-open-project]'))nodes.push(scope);
    scope?.querySelectorAll?.('[data-open-project]').forEach(el=>nodes.push(el));
    nodes.forEach(el=>{
      if(el.dataset.v74Keyboard==='true')return;
      el.dataset.v74Keyboard='true';
      el.setAttribute('aria-controls','caseViewer');
      el.setAttribute('aria-haspopup','dialog');
      if(!naturalInteractive(el)&&!el.hasAttribute('tabindex')){
        el.setAttribute('role','button');
        el.tabIndex=0;
      }
    });
  };

  decorate(document);
  if('MutationObserver'in window){
    const mo=new MutationObserver(mutations=>{
      mutations.forEach(m=>m.addedNodes.forEach(node=>{if(node.nodeType===1)decorate(node);}));
    });
    ['#archiveGrid','#projectsList','#loopWall','#caseSlides'].map(s=>document.querySelector(s)).filter(Boolean).forEach(host=>mo.observe(host,{childList:true,subtree:true}));
  }

  document.addEventListener('keydown',event=>{
    if(event.key!=='Enter'&&event.key!==' ')return;
    const opener=event.target?.closest?.('[data-open-project][data-v74-keyboard="true"]');
    if(!opener||naturalInteractive(opener)||viewer?.contains(opener))return;
    event.preventDefault();
    opener.click();
  });

  if(viewer){
    viewer.setAttribute('aria-describedby','caseTopLabel');
    const syncHidden=()=>viewer.setAttribute('aria-hidden',viewer.classList.contains('open')?'false':'true');
    syncHidden();
    if('MutationObserver'in window)new MutationObserver(syncHidden).observe(viewer,{attributes:true,attributeFilter:['class']});
  }
})();
