/* MOVX v43 — immersive lower-scroll controller
   One owner for lower-section depth. CSS 3D handles authored type/planes;
   a lightweight native WebGL corridor reinforces Processo. Essential copy stays flat. */
(() => {
  'use strict';

  const root = document.documentElement;
  const reduced = new URLSearchParams(location.search).has('static') || matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(pointer:fine)').matches;
  const q = (selector, context = document) => context.querySelector(selector);
  const qa = (selector, context = document) => [...context.querySelectorAll(selector)];
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;

  root.classList.add('movx-v43');
  root.dataset.movxImmersiveLower = 'v43-spatial-story';

  const about = q('.about-section');
  const services = q('.services-section');
  const process = q('.process-section');
  const contact = q('.contact-section');
  const lowerSections = [about, services, process, contact].filter(Boolean);
  if (!lowerSections.length || reduced) return;

  // v43 replaces the old decorative runtime but keeps v42 archive layout fixes.
  qa('.v42-parallax-layer').forEach(node => node.remove());

  function makePlane(className, childClass, text){
    const plane = document.createElement('div');
    plane.className = `v43-plane ${className}`;
    const child = document.createElement('span');
    child.className = childClass;
    child.textContent = text;
    plane.appendChild(child);
    return plane;
  }

  function makeRule(className){
    const plane = document.createElement('div');
    plane.className = `v43-plane ${className}`;
    const rule = document.createElement('span');
    rule.className = 'v43-plane__rule';
    plane.appendChild(rule);
    return plane;
  }

  function makeDepthStage(section){
    const stage = document.createElement('div');
    stage.className = 'v43-depth-stage';
    stage.setAttribute('aria-hidden','true');
    const world = document.createElement('div');
    world.className = 'v43-depth-world';
    stage.appendChild(world);
    section.insertBefore(stage, section.firstChild);
    return { stage, world };
  }

  const scenes = {};

  if (about) {
    const { stage, world } = makeDepthStage(about);
    const heading = q('h2', about)?.textContent?.trim() || 'Sobre mim';
    const primary = makePlane('v43-about-primary','v43-plane__type', heading);
    const brand = makePlane('v43-about-brand','v43-plane__type','MOVX');
    const rule = makeRule('v43-about-rule');
    world.append(primary, brand, rule);
    scenes.about = { node:about, stage, world, primary, brand, rule, active:true };
  }

  if (services) {
    const { stage, world } = makeDepthStage(services);
    world.classList.add('v43-services-orbit');
    const rows = qa('.service-row', services);
    const markers = rows.map((row, index) => {
      const marker = document.createElement('div');
      marker.className = 'v43-service-marker';
      marker.dataset.v43Service = String(index);
      marker.innerHTML = `<b>${String(index + 1).padStart(2,'0')}</b><span></span>`;
      world.appendChild(marker);
      return { marker, row, index };
    });
    scenes.services = { node:services, stage, world, rows, markers, active:true };
  }

  let processGL = null;
  if (process) {
    const stage = document.createElement('div');
    stage.className = 'v43-process-stage';
    stage.setAttribute('aria-hidden','true');
    const canvas = document.createElement('canvas');
    canvas.className = 'v43-process-webgl';
    const world = document.createElement('div');
    world.className = 'v43-process-world';
    stage.append(canvas, world);
    process.insertBefore(stage, process.firstChild);

    const rows = qa('.process-list li', process);
    const planes = rows.map((row,index) => {
      const plane = document.createElement('div');
      plane.className = 'v43-process-plane';
      const title = q('strong', row)?.textContent?.trim() || `Etapa ${index + 1}`;
      plane.innerHTML = `<b>${String(index + 1).padStart(2,'0')}</b><em>${title}</em>`;
      world.appendChild(plane);
      return { plane, row, index };
    });
    scenes.process = { node:process, stage, canvas, world, rows, planes, active:true };
  }

  if (contact) {
    const { stage, world } = makeDepthStage(contact);
    const heading = q('h2', contact)?.textContent?.trim() || 'Contato';
    const title = makePlane('v43-contact-title','v43-plane__type',heading);
    const rule = makeRule('v43-contact-rule');
    world.append(title,rule);
    scenes.contact = { node:contact, stage, world, title, rule, active:true };
  }

  const meter = document.createElement('div');
  meter.className = 'v43-journey-meter';
  meter.setAttribute('aria-hidden','true');
  document.body.appendChild(meter);

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        for (const scene of Object.values(scenes)) {
          if (scene.node === entry.target) scene.active = entry.isIntersecting;
        }
      });
      schedule();
    }, { threshold:0, rootMargin:'38% 0px 38% 0px' });
    Object.values(scenes).forEach(scene => observer.observe(scene.node));
  }

  const pointer = { x:0, y:0, tx:0, ty:0 };
  if (finePointer) {
    addEventListener('pointermove', event => {
      pointer.tx = clamp((event.clientX / Math.max(1,innerWidth) - .5) * 2,-1,1);
      pointer.ty = clamp((event.clientY / Math.max(1,innerHeight) - .5) * 2,-1,1);
      schedule();
    }, { passive:true });
    addEventListener('pointerleave', () => {
      pointer.tx = 0;
      pointer.ty = 0;
      schedule();
    }, { passive:true });
  }

  function setPx(node,name,value){ node?.style.setProperty(name,`${value.toFixed(2)}px`); }
  function setDeg(node,name,value){ node?.style.setProperty(name,`${value.toFixed(2)}deg`); }
  function setNum(node,name,value){ node?.style.setProperty(name,value.toFixed(4)); }

  function sectionProgress(node){
    const rect = node.getBoundingClientRect();
    return clamp((innerHeight - rect.top) / Math.max(1, rect.height + innerHeight),0,1);
  }

  function signedSection(node){ return sectionProgress(node) * 2 - 1; }

  /* ----------------------- WebGL Processo corridor ----------------------- */
  function initProcessGL(){
    const scene = scenes.process;
    if (!scene || innerWidth <= 980) return null;
    const canvas = scene.canvas;
    const gl = canvas.getContext('webgl',{alpha:true,antialias:true,premultipliedAlpha:false,powerPreference:'high-performance'});
    if (!gl) return null;

    const vert = `
      precision highp float;
      attribute vec3 a_position;
      uniform float u_camera;
      uniform float u_aspect;
      uniform float u_sway;
      uniform float u_velocity;
      varying float v_depth;
      void main(){
        vec3 p = a_position;
        p.z += u_camera;
        p.x += sin((p.z + 8.0) * 0.42) * u_sway;
        p.y += cos((p.z + 6.0) * 0.31) * u_velocity * 0.08;
        float depth = max(0.75, -p.z);
        vec2 xy = p.xy / depth;
        xy.x /= max(0.55,u_aspect);
        gl_Position = vec4(xy * 1.42, clamp((depth-8.0)/10.0,-1.0,1.0), 1.0);
        v_depth = clamp(1.0 - depth/16.0,0.0,1.0);
      }
    `;
    const frag = `
      precision mediump float;
      uniform vec3 u_color;
      uniform float u_velocity;
      varying float v_depth;
      void main(){
        float a = 0.10 + v_depth * 0.34 + min(abs(u_velocity),1.0)*0.08;
        gl_FragColor = vec4(u_color,a);
      }
    `;
    const shader = (type,source) => {
      const s = gl.createShader(type); gl.shaderSource(s,source); gl.compileShader(s);
      if (!gl.getShaderParameter(s,gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)||'shader error');
      return s;
    };
    const program = gl.createProgram();
    const vs = shader(gl.VERTEX_SHADER,vert), fs = shader(gl.FRAGMENT_SHADER,frag);
    gl.attachShader(program,vs); gl.attachShader(program,fs); gl.linkProgram(program);
    gl.deleteShader(vs); gl.deleteShader(fs);
    if (!gl.getProgramParameter(program,gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program)||'link error');
    gl.useProgram(program);

    // 10 rectangular gates form a real perspective corridor.
    const vertices = [];
    const gates = 10;
    for (let i=0;i<gates;i++) {
      const z = -2.0 - i*1.7;
      const w = 2.55, h = 1.62;
      const pts = [[-w,-h,z],[w,-h,z],[w,h,z],[-w,h,z]];
      const edges = [[0,1],[1,2],[2,3],[3,0]];
      edges.forEach(([a,b]) => vertices.push(...pts[a],...pts[b]));
    }
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
    gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(vertices),gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(program,'a_position');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc,3,gl.FLOAT,false,0,0);
    const uniforms = {
      camera:gl.getUniformLocation(program,'u_camera'),
      aspect:gl.getUniformLocation(program,'u_aspect'),
      sway:gl.getUniformLocation(program,'u_sway'),
      velocity:gl.getUniformLocation(program,'u_velocity'),
      color:gl.getUniformLocation(program,'u_color')
    };
    gl.clearColor(0,0,0,0);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);

    let width=0,height=0;
    function resize(){
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(devicePixelRatio||1,1.35);
      const w = Math.max(1,Math.round(rect.width*dpr));
      const h = Math.max(1,Math.round(rect.height*dpr));
      if (w!==width || h!==height) {
        width=w;height=h;canvas.width=w;canvas.height=h;gl.viewport(0,0,w,h);
      }
    }
    function parseColor(){
      const raw = getComputedStyle(document.body).getPropertyValue('--editorial-red').trim() || '#9c2e24';
      const hex = /^#([0-9a-f]{6})$/i.exec(raw);
      if (!hex) return [0.61,0.18,0.14];
      const n = parseInt(hex[1],16);
      return [((n>>16)&255)/255,((n>>8)&255)/255,(n&255)/255];
    }
    return {
      gl, program, uniforms, count:vertices.length/3,
      render(progress,velocity,pointerX){
        resize();
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.useProgram(program);
        gl.uniform1f(uniforms.camera, progress * 7.4);
        gl.uniform1f(uniforms.aspect, width/Math.max(1,height));
        gl.uniform1f(uniforms.sway, pointerX*.22 + velocity*.12);
        gl.uniform1f(uniforms.velocity, velocity);
        const c = parseColor();
        gl.uniform3f(uniforms.color,c[0],c[1],c[2]);
        gl.drawArrays(gl.LINES,0,vertices.length/3);
      }
    };
  }

  try { processGL = initProcessGL(); }
  catch (error) { console.warn('MOVX v43 process WebGL failed open:',error); processGL = null; }

  let raf = 0;
  let lastY = scrollY;
  let lastTime = performance.now();
  let velocity = 0;
  let velocityTarget = 0;

  function paintAbout(){
    const s = scenes.about;
    if (!s?.active) return;
    const p = signedSection(s.node);
    const center = 1 - Math.abs(p);
    setPx(s.world,'--v43-world-x', pointer.x*12);
    setPx(s.world,'--v43-world-y', pointer.y*8);
    setPx(s.primary,'--v43-about-x1', p*150 + pointer.x*24);
    setPx(s.primary,'--v43-about-y1', p*190 + velocity*12);
    setPx(s.primary,'--v43-about-z1', -420 + center*510);
    setDeg(s.primary,'--v43-about-r1', -2.2 + p*4.2 + velocity*.35);
    setNum(s.primary,'--v43-about-s1', .96 + center*.12);
    setNum(s.primary,'--v43-about-o1', .34 + center*.48);
    setPx(s.brand,'--v43-about-x2', -p*98 - pointer.x*14);
    setPx(s.brand,'--v43-about-y2', -p*108 + pointer.y*11);
    setPx(s.brand,'--v43-about-z2', -170 + center*250);
    setDeg(s.brand,'--v43-about-r2', 1.5 - p*2.4);
    setNum(s.brand,'--v43-about-o2', .12 + center*.24);
    setPx(s.rule,'--v43-about-x3', p*70);
    setPx(s.rule,'--v43-about-y3', -p*56);
    setPx(s.rule,'--v43-about-z3', 20 + center*130);
    setDeg(s.rule,'--v43-about-r3', p*.9);
  }

  function paintServices(){
    const s = scenes.services;
    if (!s?.active) return;
    s.markers.forEach(({marker,row,index}) => {
      const rect = row.getBoundingClientRect();
      const d = clamp((rect.top + rect.height*.5 - innerHeight*.5) / Math.max(innerHeight*.72,1),-1.35,1.35);
      const focus = 1 - clamp(Math.abs(d),0,1);
      const side = index%2 ? -1 : 1;
      setPx(marker,'--v43-service-x', side*(46 + Math.abs(d)*54) + pointer.x*12);
      setPx(marker,'--v43-service-y', d*130 + velocity*9);
      setPx(marker,'--v43-service-z', -520 + focus*620);
      setDeg(marker,'--v43-service-rx', d*7 - pointer.y*1.6);
      setDeg(marker,'--v43-service-ry', side*d*11 + pointer.x*2.2);
      setNum(marker,'--v43-service-scale', .92 + focus*.14);
      setNum(marker,'--v43-service-opacity', .05 + focus*.22);
    });
  }

  function paintProcess(){
    const s = scenes.process;
    if (!s?.active || innerWidth <= 980) return;
    const p = sectionProgress(s.node);
    const count = Math.max(1,s.planes.length);
    const travel = Math.max(0,count-1)*360;
    const cam = p*travel;
    setPx(s.world,'--v43-process-world-z',cam);
    setPx(s.world,'--v43-process-world-x',pointer.x*18 + Math.sin(p*Math.PI*2)*14);
    setPx(s.world,'--v43-process-world-y',pointer.y*11 + velocity*8);
    setDeg(s.world,'--v43-process-world-rx',-pointer.y*1.6 - velocity*.55);
    setDeg(s.world,'--v43-process-world-ry',pointer.x*2.4 + Math.sin(p*Math.PI)*2.3);

    const activeIndex = Math.round(p*Math.max(0,count-1));
    s.planes.forEach(({plane,row,index}) => {
      const rel = index - p*Math.max(0,count-1);
      const abs = Math.abs(rel);
      const side = index%2 ? -1 : 1;
      const z = -120 - index*360;
      setPx(plane,'--v43-plane-x',side*(38 + Math.min(abs,2)*26));
      setPx(plane,'--v43-plane-y',rel*24);
      setPx(plane,'--v43-plane-z',z);
      setDeg(plane,'--v43-plane-rx',rel*3.2);
      setDeg(plane,'--v43-plane-ry',side*rel*6.6);
      setNum(plane,'--v43-process-plane-opacity', .045 + clamp(1-abs,0,1)*.31);
      row.classList.toggle('v43-process-current',index===activeIndex);
    });
    processGL?.render(p,velocity,pointer.x);
  }

  function paintContact(){
    const s = scenes.contact;
    if (!s?.active) return;
    const p = signedSection(s.node);
    const center = 1-Math.abs(p);
    setPx(s.title,'--v43-contact-x',-p*135 + pointer.x*18);
    setPx(s.title,'--v43-contact-y',p*168 + pointer.y*12 + velocity*8);
    setPx(s.title,'--v43-contact-z',-460 + center*530);
    setDeg(s.title,'--v43-contact-rx',p*4.8 - pointer.y*1.4);
    setNum(s.title,'--v43-contact-s',.94 + center*.12);
    setNum(s.title,'--v43-contact-o',.18 + center*.42);
    setPx(s.rule,'--v43-contact-rule-x',p*82 - pointer.x*8);
    setPx(s.rule,'--v43-contact-rule-y',-p*72);
    setPx(s.rule,'--v43-contact-rule-z',20 + center*150);
    setDeg(s.rule,'--v43-contact-rule-r',-p*1.2);
  }

  function paintJourney(){
    if (!about || !contact) return;
    const a = about.getBoundingClientRect();
    const c = contact.getBoundingClientRect();
    const start = scrollY + a.top - innerHeight*.3;
    const end = scrollY + c.bottom - innerHeight*.7;
    const progress = clamp((scrollY-start)/Math.max(1,end-start),0,1);
    meter.style.setProperty('--v43-journey',progress.toFixed(4));
    meter.classList.toggle('is-live', progress>0 && progress<1);
  }

  function paint(){
    pointer.x = lerp(pointer.x,pointer.tx,.10);
    pointer.y = lerp(pointer.y,pointer.ty,.10);
    velocity = lerp(velocity,velocityTarget,.17);
    velocityTarget *= .76;
    paintAbout();
    paintServices();
    paintProcess();
    paintContact();
    paintJourney();
  }

  function frame(){
    raf = 0;
    if (document.hidden) return;
    paint();
    const unsettled = Math.abs(pointer.x-pointer.tx)>.005 || Math.abs(pointer.y-pointer.ty)>.005 || Math.abs(velocity)>.006 || Math.abs(velocityTarget)>.006;
    if (unsettled) schedule();
  }
  function schedule(){ if (!raf && !document.hidden) raf = requestAnimationFrame(frame); }

  addEventListener('scroll',() => {
    const now = performance.now();
    const dy = scrollY-lastY;
    const dt = Math.max(16,now-lastTime);
    lastY=scrollY;lastTime=now;
    velocityTarget = clamp((dy/dt)*2.6,-1.5,1.5);
    schedule();
  },{passive:true});
  addEventListener('resize',() => {
    try { if (innerWidth>980 && !processGL) processGL=initProcessGL(); } catch (_) {}
    schedule();
  },{passive:true});
  document.addEventListener('visibilitychange',() => {
    if (!document.hidden) schedule();
    else if (raf) { cancelAnimationFrame(raf); raf=0; }
  },{passive:true});

  schedule();
})();
