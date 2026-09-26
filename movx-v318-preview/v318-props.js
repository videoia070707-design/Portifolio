(()=>{
  document.documentElement.classList.add('v318');
  const section=document.querySelector('#playground,.play311');
  if(!section)return;

  const definitions=[
    {slot:'play-cassette',label:'Cassete MOVX arrastável',param:'cassetteModel'},
    {slot:'play-camera',label:'Câmera MOVX arrastável',param:'cameraModel'},
    {slot:'play-cube',label:'Cubo X MOVX arrastável',param:'cubeModel'},
    {slot:'play-cd',label:'CD MOVX arrastável',param:'cdModel'},
    {slot:'play-window',label:'Tela portátil MOVX arrastável',param:'windowModel'}
  ];

  const params=new URLSearchParams(location.search);
  window.MOVX3D=window.MOVX3D||{};
  window.MOVX3D.slots=window.MOVX3D.slots||{};

  definitions.forEach(def=>{
    const el=section.querySelector(`[data-model-slot="${def.slot}"]`);
    if(!el)return;
    el.tabIndex=0;
    el.setAttribute('role','button');
    el.setAttribute('aria-label',def.label);
    el.dataset.propState='dom-fallback';

    const requested=params.get(def.param);
    if(requested){
      el.dataset.modelSrc=requested;
      el.dataset.modelRequested='1';
    }

    const down=()=>el.classList.add('v318-held');
    const up=()=>el.classList.remove('v318-held');
    el.addEventListener('pointerdown',down,{passive:true});
    el.addEventListener('pointerup',up,{passive:true});
    el.addEventListener('pointercancel',up,{passive:true});

    window.MOVX3D.slots[def.slot]={
      element:el,
      requestedSrc:requested||null,
      fallback:'dom-playground-prop',
      replaceWith(rendererElement){
        if(!rendererElement)return false;
        rendererElement.setAttribute('data-runtime-prop',def.slot);
        rendererElement.setAttribute('data-runtime-model',def.slot);
        el.classList.add('has-runtime-model');
        el.dataset.propState='external-renderer';
        el.appendChild(rendererElement);
        return true;
      },
      restoreFallback(){
        el.querySelectorAll(`[data-runtime-prop="${def.slot}"]`).forEach(node=>node.remove());
        el.classList.remove('has-runtime-model');
        el.dataset.propState='dom-fallback';
      }
    };
  });

  const io=new IntersectionObserver(entries=>{
    entries.forEach(entry=>section.classList.toggle('v318-active',entry.isIntersecting));
  },{threshold:.12});
  io.observe(section);
})();
