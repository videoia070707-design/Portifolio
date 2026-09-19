/* MOVX v41 — WebGL project portal + mood runtime
   The clicked artwork becomes the transition itself. The source image expands through
   a GPU-distorted mesh into the case viewer, and contracts back to its opener on close.
   No external animation runtime; text and layout stay untouched. */
(() => {
  'use strict';

  const root = document.documentElement;
  const reduced = new URLSearchParams(location.search).has('static') || matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(pointer:fine)').matches;
  const section = document.querySelector('.projects-list');
  const list = document.getElementById('projectsList');
  const viewer = document.getElementById('caseViewer');
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const ease = t => 1 - Math.pow(1 - clamp(t), 4);

  root.classList.add('movx-v41');
  root.dataset.movxProjectPortal = 'v41-webgl-project-transition';

  if (!section || !list || !viewer) return;

  /* --------------------------------------------------------------
     1) Mood follows the project closest to the reading line.
     -------------------------------------------------------------- */
  let moodRaf = 0;
  const syncMood = () => {
    moodRaf = 0;
    const current = list.querySelector('.project-entry.v39-depth-current') || list.querySelector('.project-entry');
    if (!current) return;
    const accent = getComputedStyle(current).getPropertyValue('--v38-accent').trim();
    if (accent) section.style.setProperty('--v41-mood', accent);
  };
  const scheduleMood = () => {
    if (!moodRaf) moodRaf = requestAnimationFrame(syncMood);
  };
  scheduleMood();

  if ('MutationObserver' in window) {
    new MutationObserver(mutations => {
      if (mutations.some(m => m.type === 'attributes' && m.attributeName === 'class')) scheduleMood();
    }).observe(list, { subtree:true, attributes:true, attributeFilter:['class'] });
  }

  /* --------------------------------------------------------------
     2) Record the exact media rectangle before the base runtime opens
        the case. The DOM still owns click/navigation semantics.
     -------------------------------------------------------------- */
  let snapshot = null;
  let wasOpen = viewer.classList.contains('open');

  const mediaFor = opener => {
    if (!opener) return null;
    if (opener.matches('img')) return opener;
    return opener.querySelector('img') || opener.closest('.project-entry')?.querySelector('.project-cover img') || null;
  };

  const takeSnapshot = opener => {
    if (!opener || viewer.contains(opener)) return;
    const img = mediaFor(opener);
    if (!img) return;
    const rect = img.getBoundingClientRect();
    if (rect.width < 4 || rect.height < 4) return;
    snapshot = {
      opener,
      img,
      src: img.currentSrc || img.src,
      rect: { left:rect.left, top:rect.top, width:rect.width, height:rect.height },
      slug: opener.getAttribute('data-open-project') || opener.closest('[data-open-project]')?.getAttribute('data-open-project') || ''
    };
  };

  document.addEventListener('pointerdown', event => {
    const opener = event.target?.closest?.('[data-open-project]');
    if (opener && !viewer.contains(opener)) takeSnapshot(opener);
  }, { capture:true, passive:true });

  document.addEventListener('focusin', event => {
    const opener = event.target?.closest?.('[data-open-project]');
    if (opener && !viewer.contains(opener)) takeSnapshot(opener);
  }, true);

  if (finePointer) {
    document.addEventListener('pointerenter', event => {
      const opener = event.target?.closest?.('[data-open-project]');
      if (opener && !viewer.contains(opener)) {
        const img = mediaFor(opener);
        img?.decode?.().catch(() => {});
      }
    }, true);
  }

  if (reduced) {
    root.classList.add('v41-portal-reduced');
    return;
  }

  /* --------------------------------------------------------------
     3) Lazy native WebGL transition renderer.
     -------------------------------------------------------------- */
  let stage = null;
  let canvas = null;
  let gl = null;
  let program = null;
  let attrib = -1;
  let uniforms = null;
  let indexCount = 0;
  let texture = null;
  let frame = 0;
  let transitionToken = 0;
  let glFailed = false;

  const VERT = `
    precision highp float;
    attribute vec2 a_position;
    uniform vec4 u_from;
    uniform vec4 u_to;
    uniform float u_progress;
    uniform float u_time;
    uniform float u_direction;
    varying vec2 v_uv;
    varying float v_pulse;
    void main(){
      vec2 uv = a_position;
      float t = u_progress;
      float pulse = sin(t * 3.14159265);
      vec4 rect = mix(u_from, u_to, t);
      vec2 p = rect.xy + uv * rect.zw;
      float center = 1.0 - min(1.0, length(uv - 0.5) * 1.6);
      float waveX = sin(uv.y * 9.4247 + u_time * 2.1) * 0.010 * pulse;
      float waveY = sin(uv.x * 6.2831 - u_time * 1.7) * 0.007 * pulse;
      float curl = (uv.y - 0.5) * (uv.y - 0.5) * 0.038 * pulse * u_direction;
      p.x += waveX + curl;
      p.y += waveY - center * 0.010 * pulse;
      vec2 clip = vec2(p.x * 2.0 - 1.0, 1.0 - p.y * 2.0);
      gl_Position = vec4(clip, 0.0, 1.0);
      v_uv = uv;
      v_pulse = pulse;
    }
  `;

  const FRAG = `
    precision mediump float;
    uniform sampler2D u_texture;
    uniform float u_texAspect;
    uniform float u_rectAspect;
    uniform float u_progress;
    uniform float u_time;
    uniform float u_direction;
    varying vec2 v_uv;
    varying float v_pulse;

    float rand(vec2 co){
      return fract(sin(dot(co.xy, vec2(12.9898,78.233))) * 43758.5453);
    }

    vec2 coverUv(vec2 uv){
      float ta = max(0.001, u_texAspect);
      float ra = max(0.001, u_rectAspect);
      vec2 outUv = uv;
      if (ta > ra) {
        float visible = ra / ta;
        outUv.x = (uv.x - 0.5) * visible + 0.5;
      } else {
        float visible = ta / ra;
        outUv.y = (uv.y - 0.5) * visible + 0.5;
      }
      return outUv;
    }

    void main(){
      vec2 uv = coverUv(v_uv);
      float chroma = 0.0036 * v_pulse;
      float bend = (v_uv.y - 0.5) * 0.012 * v_pulse * u_direction;
      uv.x += bend;
      vec4 base = texture2D(u_texture, uv);
      float r = texture2D(u_texture, uv + vec2(chroma, 0.0)).r;
      float b = texture2D(u_texture, uv - vec2(chroma, 0.0)).b;
      vec3 color = vec3(r, base.g, b);
      float grain = (rand(v_uv * 1140.0 + u_time) - 0.5) * 0.035 * v_pulse;
      color += grain;
      float edge = smoothstep(0.86, 0.24, length(v_uv - 0.5));
      color *= 0.96 + edge * 0.06;
      float fade = 1.0 - smoothstep(0.88, 1.0, u_progress);
      gl_FragColor = vec4(color, base.a * fade);
    }
  `;

  function shader(type, source){
    const s = gl.createShader(type);
    gl.shaderSource(s, source);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      const message = gl.getShaderInfoLog(s) || 'shader compile error';
      gl.deleteShader(s);
      throw new Error(message);
    }
    return s;
  }

  function buildProgram(){
    const vs = shader(gl.VERTEX_SHADER, VERT);
    const fs = shader(gl.FRAGMENT_SHADER, FRAG);
    const p = gl.createProgram();
    gl.attachShader(p, vs);
    gl.attachShader(p, fs);
    gl.linkProgram(p);
    gl.deleteShader(vs);
    gl.deleteShader(fs);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p) || 'program link error');
    return p;
  }

  function buildGrid(cols = 30, rows = 34){
    const verts = [];
    const indices = [];
    for (let y=0;y<=rows;y++) {
      for (let x=0;x<=cols;x++) verts.push(x/cols, y/rows);
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
    const vb = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vb);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verts), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(attrib);
    gl.vertexAttribPointer(attrib, 2, gl.FLOAT, false, 0, 0);
    const ib = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ib);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
  }

  function ensureRenderer(){
    if (gl || glFailed) return !!gl;
    try {
      stage = document.createElement('div');
      stage.className = 'v41-project-transition';
      stage.setAttribute('aria-hidden','true');
      canvas = document.createElement('canvas');
      canvas.className = 'v41-project-transition__canvas';
      stage.appendChild(canvas);
      document.body.appendChild(stage);

      gl = canvas.getContext('webgl', { alpha:true, antialias:true, premultipliedAlpha:false, powerPreference:'high-performance' });
      if (!gl) throw new Error('WebGL transition unavailable');
      program = buildProgram();
      gl.useProgram(program);
      attrib = gl.getAttribLocation(program, 'a_position');
      uniforms = {
        from:gl.getUniformLocation(program,'u_from'),
        to:gl.getUniformLocation(program,'u_to'),
        progress:gl.getUniformLocation(program,'u_progress'),
        time:gl.getUniformLocation(program,'u_time'),
        direction:gl.getUniformLocation(program,'u_direction'),
        texAspect:gl.getUniformLocation(program,'u_texAspect'),
        rectAspect:gl.getUniformLocation(program,'u_rectAspect'),
        texture:gl.getUniformLocation(program,'u_texture')
      };
      buildGrid();
      gl.clearColor(0,0,0,0);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      canvas.addEventListener('webglcontextlost', event => {
        event.preventDefault();
        glFailed = true;
        gl = null;
        stage?.remove();
        root.classList.add('v41-portal-fallback');
      }, { once:true });
      resizeCanvas();
      return true;
    } catch (error) {
      glFailed = true;
      gl = null;
      stage?.remove();
      root.classList.add('v41-portal-fallback');
      console.warn('MOVX v41 project portal unavailable:', error);
      return false;
    }
  }

  function resizeCanvas(){
    if (!gl || !canvas) return;
    const dpr = Math.min(devicePixelRatio || 1, 1.5);
    const w = Math.max(1, Math.round(innerWidth*dpr));
    const h = Math.max(1, Math.round(innerHeight*dpr));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
      gl.viewport(0,0,w,h);
    }
  }

  function setTexture(img){
    if (!gl || !img?.complete || !img.naturalWidth) return false;
    if (texture) gl.deleteTexture(texture);
    texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,img);
    return true;
  }

  function rectNorm(rect){
    return [
      clamp(rect.left / Math.max(1,innerWidth), -0.2, 1.2),
      clamp(rect.top / Math.max(1,innerHeight), -0.2, 1.2),
      clamp(rect.width / Math.max(1,innerWidth), 0.01, 1.4),
      clamp(rect.height / Math.max(1,innerHeight), 0.01, 1.4)
    ];
  }

  function runPortal(direction){
    if (!snapshot?.img || !ensureRenderer() || !setTexture(snapshot.img)) return;
    cancelAnimationFrame(frame);
    const token = ++transitionToken;
    resizeCanvas();
    const source = rectNorm(snapshot.rect);
    const full = [0,0,1,1];
    const from = direction > 0 ? source : full;
    const to = direction > 0 ? full : source;
    const texAspect = snapshot.img.naturalWidth / Math.max(1,snapshot.img.naturalHeight);
    const duration = direction > 0 ? 880 : 760;
    const start = performance.now();

    stage.dataset.direction = direction > 0 ? 'open' : 'close';
    stage.classList.add('v41-transition-live');
    root.classList.add('v41-transition-running');

    const draw = now => {
      if (token !== transitionToken || !gl) return;
      const raw = clamp((now-start)/duration);
      const t = ease(raw);
      const currentAspect = ((from[2] + (to[2]-from[2])*t) * innerWidth) / Math.max(1, (from[3] + (to[3]-from[3])*t) * innerHeight);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.useProgram(program);
      gl.uniform4fv(uniforms.from, from);
      gl.uniform4fv(uniforms.to, to);
      gl.uniform1f(uniforms.progress, t);
      gl.uniform1f(uniforms.time, now/1000);
      gl.uniform1f(uniforms.direction, direction);
      gl.uniform1f(uniforms.texAspect, texAspect);
      gl.uniform1f(uniforms.rectAspect, currentAspect);
      gl.uniform1i(uniforms.texture, 0);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.drawElements(gl.TRIANGLES, indexCount, gl.UNSIGNED_SHORT, 0);

      if (raw < 1) frame = requestAnimationFrame(draw);
      else {
        frame = 0;
        stage.classList.remove('v41-transition-live');
        root.classList.remove('v41-transition-running');
        gl.clear(gl.COLOR_BUFFER_BIT);
      }
    };
    frame = requestAnimationFrame(draw);
  }

  addEventListener('resize', resizeCanvas, { passive:true });

  if ('MutationObserver' in window) {
    new MutationObserver(() => {
      const isOpen = viewer.classList.contains('open');
      if (isOpen && !wasOpen) {
        runPortal(1);
      } else if (!isOpen && wasOpen) {
        // Refresh the destination in case responsive layout or scrolling changed it.
        if (snapshot?.opener?.isConnected) {
          const img = mediaFor(snapshot.opener);
          const rect = img?.getBoundingClientRect();
          if (img && rect && rect.width > 4 && rect.height > 4) {
            snapshot.img = img;
            snapshot.rect = { left:rect.left, top:rect.top, width:rect.width, height:rect.height };
          }
        }
        runPortal(-1);
      }
      wasOpen = isOpen;
    }).observe(viewer, { attributes:true, attributeFilter:['class'] });
  }
})();
