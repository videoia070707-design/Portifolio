/* MOVX v40 — native WebGL scroll corridor
   Real GPU-rendered project planes, scroll-scrubbed camera depth, velocity bending,
   pointer drift, and strict fail-open behavior. No external runtime dependency. */
(() => {
  'use strict';

  const root = document.documentElement;
  const reduced = new URLSearchParams(location.search).has('static') || matchMedia('(prefers-reduced-motion: reduce)').matches;
  const projects = Array.isArray(window.MOVX_PROJECTS) ? window.MOVX_PROJECTS : [];
  const section = document.querySelector('.projects-list');
  const list = document.getElementById('projectsList');
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;

  root.classList.add('movx-v40');
  root.dataset.movxWebgl = 'v40-native-scroll-corridor';

  if (reduced || !section || !list || projects.length < 2) {
    root.classList.add('v40-webgl-fallback');
    return;
  }

  let stage = null;
  let canvas = null;
  let gl = null;
  let frameId = 0;
  let visible = false;
  let destroyed = false;
  let current = 0;
  let target = 0;
  let velocity = 0;
  let velocityTarget = 0;
  let lastScrollY = scrollY;
  let lastScrollAt = performance.now();
  let pointerX = 0;
  let pointerY = 0;
  let pointerTX = 0;
  let pointerTY = 0;
  let program = null;
  let attribs = null;
  let uniforms = null;
  let indexCount = 0;
  let planes = [];
  let startTime = performance.now();
  let width = 1;
  let height = 1;
  let dpr = 1;

  const VERT = `
    precision highp float;
    attribute vec2 a_position;
    attribute vec2 a_uv;
    uniform mat4 u_projection;
    uniform mat4 u_model;
    uniform float u_time;
    uniform float u_velocity;
    uniform float u_phase;
    uniform float u_curve;
    varying vec2 v_uv;
    varying float v_edge;
    void main(){
      vec3 p = vec3(a_position, 0.0);
      float velocity = clamp(abs(u_velocity), 0.0, 1.8);
      float arch = pow(abs(a_uv.x - 0.5) * 2.0, 2.0);
      float wave = sin(a_uv.y * 6.28318 + u_phase + u_time * 0.42) * 0.028 * velocity;
      p.z += arch * u_curve + wave;
      p.x += sin(a_uv.y * 3.14159 + u_phase) * 0.018 * u_velocity;
      gl_Position = u_projection * u_model * vec4(p, 1.0);
      v_uv = a_uv;
      v_edge = 1.0 - smoothstep(0.34, 0.72, length(a_uv - 0.5));
    }
  `;

  const FRAG = `
    precision mediump float;
    uniform sampler2D u_texture;
    uniform float u_opacity;
    uniform float u_velocity;
    uniform float u_focus;
    uniform float u_loaded;
    varying vec2 v_uv;
    varying float v_edge;
    void main(){
      vec2 uv = v_uv;
      float smear = clamp(abs(u_velocity), 0.0, 1.4) * 0.006;
      uv.y += (uv.y - 0.5) * smear;
      vec4 tex = texture2D(u_texture, uv);
      vec3 color = tex.rgb;
      float luma = dot(color, vec3(0.299,0.587,0.114));
      color = mix(vec3(luma), color, 0.78 + u_focus * 0.22);
      color *= 0.90 + u_focus * 0.14;
      float vignette = smoothstep(0.02, 0.32, v_edge);
      float alpha = u_opacity * mix(0.72, 1.0, vignette) * mix(0.72, 1.0, u_loaded);
      gl_FragColor = vec4(color, alpha * tex.a);
    }
  `;

  function createShader(type, source){
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      const message = gl.getShaderInfoLog(shader) || 'Unknown shader compilation error';
      gl.deleteShader(shader);
      throw new Error(message);
    }
    return shader;
  }

  function createProgram(){
    const vs = createShader(gl.VERTEX_SHADER, VERT);
    const fs = createShader(gl.FRAGMENT_SHADER, FRAG);
    const p = gl.createProgram();
    gl.attachShader(p, vs);
    gl.attachShader(p, fs);
    gl.linkProgram(p);
    gl.deleteShader(vs);
    gl.deleteShader(fs);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
      const message = gl.getProgramInfoLog(p) || 'Unknown program link error';
      gl.deleteProgram(p);
      throw new Error(message);
    }
    return p;
  }

  function mat4Identity(){
    return new Float32Array([1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1]);
  }

  function mat4Multiply(a,b){
    const out = new Float32Array(16);
    for (let c=0;c<4;c++) {
      for (let r=0;r<4;r++) {
        out[c*4+r] =
          a[0*4+r]*b[c*4+0] +
          a[1*4+r]*b[c*4+1] +
          a[2*4+r]*b[c*4+2] +
          a[3*4+r]*b[c*4+3];
      }
    }
    return out;
  }

  function mat4Perspective(fov, aspect, near, far){
    const f = 1 / Math.tan(fov/2);
    const nf = 1 / (near - far);
    return new Float32Array([
      f/aspect,0,0,0,
      0,f,0,0,
      0,0,(far+near)*nf,-1,
      0,0,(2*far*near)*nf,0
    ]);
  }

  function mat4Translate(x,y,z){
    const m = mat4Identity();
    m[12]=x;m[13]=y;m[14]=z;
    return m;
  }

  function mat4Scale(x,y,z){
    const m = mat4Identity();
    m[0]=x;m[5]=y;m[10]=z;
    return m;
  }

  function mat4RotateX(a){
    const c=Math.cos(a),s=Math.sin(a);
    return new Float32Array([1,0,0,0, 0,c,s,0, 0,-s,c,0, 0,0,0,1]);
  }

  function mat4RotateY(a){
    const c=Math.cos(a),s=Math.sin(a);
    return new Float32Array([c,0,-s,0, 0,1,0,0, s,0,c,0, 0,0,0,1]);
  }

  function mat4RotateZ(a){
    const c=Math.cos(a),s=Math.sin(a);
    return new Float32Array([c,s,0,0, -s,c,0,0, 0,0,1,0, 0,0,0,1]);
  }

  function composeModel({x,y,z,rx,ry,rz,sx,sy}){
    let m = mat4Translate(x,y,z);
    m = mat4Multiply(m, mat4RotateZ(rz));
    m = mat4Multiply(m, mat4RotateY(ry));
    m = mat4Multiply(m, mat4RotateX(rx));
    m = mat4Multiply(m, mat4Scale(sx,sy,1));
    return m;
  }

  function createGrid(cols = 18, rows = 22){
    const vertices = [];
    const uvs = [];
    const indices = [];
    for (let y=0;y<=rows;y++) {
      for (let x=0;x<=cols;x++) {
        const u = x/cols;
        const v = y/rows;
        vertices.push((u-.5)*2, (v-.5)*-2);
        uvs.push(u,1-v);
      }
    }
    for (let y=0;y<rows;y++) {
      for (let x=0;x<cols;x++) {
        const a = y*(cols+1)+x;
        const b = a+1;
        const c = a+(cols+1);
        const d = c+1;
        indices.push(a,c,b,b,c,d);
      }
    }
    indexCount = indices.length;

    const posBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER,posBuffer);
    gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(vertices),gl.STATIC_DRAW);
    gl.enableVertexAttribArray(attribs.position);
    gl.vertexAttribPointer(attribs.position,2,gl.FLOAT,false,0,0);

    const uvBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER,uvBuffer);
    gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(uvs),gl.STATIC_DRAW);
    gl.enableVertexAttribArray(attribs.uv);
    gl.vertexAttribPointer(attribs.uv,2,gl.FLOAT,false,0,0);

    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Uint16Array(indices),gl.STATIC_DRAW);
  }

  function placeholderTexture(){
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D,tex);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
    gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,1,1,0,gl.RGBA,gl.UNSIGNED_BYTE,new Uint8Array([24,24,24,255]));
    return tex;
  }

  function loadTexture(plane){
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => {
      if (destroyed || !gl) return;
      plane.aspect = clamp(img.naturalWidth / Math.max(1,img.naturalHeight), .62, 1.55);
      gl.bindTexture(gl.TEXTURE_2D,plane.texture);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,1);
      gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,img);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
      plane.loaded = 1;
      schedule();
    };
    img.onerror = () => { plane.failed = true; };
    img.src = plane.src;
  }

  function buildStage(){
    stage = document.createElement('div');
    stage.className = 'v40-webgl-stage';
    stage.setAttribute('aria-hidden','true');
    canvas = document.createElement('canvas');
    canvas.className = 'v40-webgl-canvas';
    stage.appendChild(canvas);
    section.insertBefore(stage, section.firstChild);
  }

  function resize(){
    if (!canvas || !gl) return;
    const rect = canvas.getBoundingClientRect();
    width = Math.max(1,Math.round(rect.width));
    height = Math.max(1,Math.round(rect.height));
    dpr = Math.min(devicePixelRatio || 1, innerWidth < 900 ? 1 : 1.5);
    const w = Math.max(1,Math.round(width*dpr));
    const h = Math.max(1,Math.round(height*dpr));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
      gl.viewport(0,0,w,h);
    }
  }

  function readScrollTarget(){
    const rect = list.getBoundingClientRect();
    const travel = Math.max(1, rect.height - innerHeight * .35);
    const progress = clamp((innerHeight * .72 - rect.top) / travel, 0, 1);
    target = progress * Math.max(1, planes.length - 1);
  }

  function updateVelocity(){
    const now = performance.now();
    const dy = scrollY - lastScrollY;
    const dt = Math.max(16, now - lastScrollAt);
    lastScrollY = scrollY;
    lastScrollAt = now;
    velocityTarget = clamp((dy/dt)*3.2,-1.6,1.6);
  }

  function render(time){
    frameId = 0;
    if (destroyed || !visible || document.hidden || !gl) return;

    current = lerp(current,target,.085);
    velocity = lerp(velocity,velocityTarget,.12);
    velocityTarget *= .82;
    pointerX = lerp(pointerX,pointerTX,.08);
    pointerY = lerp(pointerY,pointerTY,.08);

    resize();
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.useProgram(program);

    const projection = mat4Perspective(Math.PI/3.2, (canvas.width/canvas.height)||1, .1, 80);
    gl.uniformMatrix4fv(uniforms.projection,false,projection);
    gl.uniform1f(uniforms.time,(time-startTime)/1000);
    gl.uniform1f(uniforms.velocity,velocity);
    gl.uniform1i(uniforms.texture,0);

    const draw = [];
    planes.forEach((plane,index) => {
      const rel = index-current;
      const z = -3.15 - rel*3.55;
      if (z > -.72 || z < -19.5) return;
      draw.push({plane,index,rel,z});
    });
    draw.sort((a,b)=>a.z-b.z);

    draw.forEach(({plane,index,rel,z}) => {
      const abs = Math.abs(rel);
      const focus = clamp(1-abs/1.45,0,1);
      const side = index%2 ? -1 : 1;
      const x = side*(1.45 + Math.min(abs,2.5)*.16) + pointerX*.18 + Math.sin(index*1.7+current*.45)*.08;
      const y = ((index%3)-1)*.22 - pointerY*.12 + velocity*.09;
      const ry = side*(.18 + clamp(abs,0,2)*.035) + pointerX*.055 + velocity*.03*side;
      const rx = -.035 + pointerY*.04 - velocity*.045;
      const rz = side*velocity*.018 + Math.sin(index*.8)*.012;
      const baseH = 1.62 + focus*.18;
      const sx = baseH*plane.aspect;
      const sy = baseH;
      const model = composeModel({x,y,z,rx,ry,rz,sx,sy});
      const opacity = clamp(.10 + focus*.27 + (1-clamp(abs/3,0,1))*.04,.08,.40);
      const curve = .055 + Math.abs(velocity)*.055 + (1-focus)*.018;

      gl.uniformMatrix4fv(uniforms.model,false,model);
      gl.uniform1f(uniforms.opacity,opacity);
      gl.uniform1f(uniforms.focus,focus);
      gl.uniform1f(uniforms.loaded,plane.loaded);
      gl.uniform1f(uniforms.phase,index*.83);
      gl.uniform1f(uniforms.curve,curve);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D,plane.texture);
      gl.drawElements(gl.TRIANGLES,indexCount,gl.UNSIGNED_SHORT,0);
    });

    const unsettled = Math.abs(current-target)>.002 || Math.abs(velocity)>.002 || Math.abs(velocityTarget)>.002 || Math.abs(pointerX-pointerTX)>.002 || Math.abs(pointerY-pointerTY)>.002;
    if (visible && !document.hidden && (unsettled || Math.abs(velocity)>.001)) schedule();
  }

  function schedule(){
    if (!visible || destroyed || document.hidden || frameId) return;
    frameId = requestAnimationFrame(render);
  }

  function initGL(){
    buildStage();
    gl = canvas.getContext('webgl',{ alpha:true, antialias:true, depth:true, premultipliedAlpha:false, powerPreference:'high-performance' });
    if (!gl) throw new Error('WebGL unavailable');

    canvas.addEventListener('webglcontextlost', event => {
      event.preventDefault();
      destroyed = true;
      root.classList.add('v40-webgl-fallback');
      stage?.remove();
    }, { once:true });

    program = createProgram();
    gl.useProgram(program);
    attribs = {
      position: gl.getAttribLocation(program,'a_position'),
      uv: gl.getAttribLocation(program,'a_uv')
    };
    uniforms = {
      projection: gl.getUniformLocation(program,'u_projection'),
      model: gl.getUniformLocation(program,'u_model'),
      time: gl.getUniformLocation(program,'u_time'),
      velocity: gl.getUniformLocation(program,'u_velocity'),
      phase: gl.getUniformLocation(program,'u_phase'),
      curve: gl.getUniformLocation(program,'u_curve'),
      texture: gl.getUniformLocation(program,'u_texture'),
      opacity: gl.getUniformLocation(program,'u_opacity'),
      focus: gl.getUniformLocation(program,'u_focus'),
      loaded: gl.getUniformLocation(program,'u_loaded')
    };
    createGrid();

    gl.clearColor(0,0,0,0);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);

    planes = projects.slice(0,Math.min(projects.length,12)).map((project,index) => ({
      index,
      slug:project.slug || String(index),
      src:project.cover,
      texture:placeholderTexture(),
      aspect:.8,
      loaded:0,
      failed:false
    }));
    planes.forEach(loadTexture);
    resize();
    readScrollTarget();
  }

  try {
    initGL();

    const observer = 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
      visible = entries.some(entry => entry.isIntersecting);
      stage?.classList.toggle('v40-webgl-active',visible);
      if (visible) {
        readScrollTarget();
        schedule();
      } else if (frameId) {
        cancelAnimationFrame(frameId);
        frameId = 0;
      }
    },{ threshold:0, rootMargin:'45% 0px' }) : null;
    if (observer) observer.observe(section);
    else { visible = true; stage?.classList.add('v40-webgl-active'); }

    addEventListener('scroll',() => {
      updateVelocity();
      readScrollTarget();
      schedule();
    },{passive:true});

    addEventListener('resize',() => {
      resize();
      readScrollTarget();
      schedule();
    },{passive:true});

    section.addEventListener('pointermove',event => {
      if (matchMedia('(pointer:fine)').matches) {
        pointerTX = clamp((event.clientX/Math.max(1,innerWidth)-.5)*2,-1,1);
        pointerTY = clamp((event.clientY/Math.max(1,innerHeight)-.5)*2,-1,1);
        schedule();
      }
    },{passive:true});

    section.addEventListener('pointerleave',() => {
      pointerTX = 0;
      pointerTY = 0;
      schedule();
    },{passive:true});

    document.addEventListener('visibilitychange',() => {
      if (!document.hidden) { readScrollTarget(); schedule(); }
      else if (frameId) { cancelAnimationFrame(frameId); frameId=0; }
    },{passive:true});

    stage?.classList.add('v40-webgl-ready');
    if (visible) schedule();
  } catch (error) {
    root.classList.add('v40-webgl-fallback');
    stage?.remove();
    console.warn('MOVX v40 WebGL corridor failed open:',error);
  }
})();