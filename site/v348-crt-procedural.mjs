/* MOVX v348 — Scene 01 procedural CRT.
   Real WebGL geometry used while the final Tripo GLB is still pending.
   Scope is deliberately limited to boot-tv. The returned object follows the
   same renderer contract as a loaded GLB so the final asset can replace it later. */

const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));

function roundedRectShape(THREE,w,h,r){
  const x=-w/2,y=-h/2;
  const s=new THREE.Shape();
  s.moveTo(x+r,y);
  s.lineTo(x+w-r,y);s.quadraticCurveTo(x+w,y,x+w,y+r);
  s.lineTo(x+w,y+h-r);s.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
  s.lineTo(x+r,y+h);s.quadraticCurveTo(x,y+h,x,y+h-r);
  s.lineTo(x,y+r);s.quadraticCurveTo(x,y,x+r,y);
  return s;
}

function roundedBlock(THREE,{w,h,d,r=.08,bevel=.025,segments=3,material,name}){
  const shape=roundedRectShape(THREE,w,h,Math.min(r,w*.22,h*.22));
  const geo=new THREE.ExtrudeGeometry(shape,{
    depth:d,
    bevelEnabled:true,
    bevelThickness:bevel,
    bevelSize:bevel,
    bevelSegments:segments,
    curveSegments:8,
    steps:1,
  });
  geo.translate(0,0,-d/2);
  geo.computeVertexNormals();
  const mesh=new THREE.Mesh(geo,material);
  mesh.name=name||'RoundedBlock';
  mesh.castShadow=true;mesh.receiveShadow=true;
  return mesh;
}

function box(THREE,w,h,d,material,name){
  const g=new THREE.BoxGeometry(w,h,d,1,1,1);
  const m=new THREE.Mesh(g,material);m.name=name||'Box';m.castShadow=true;m.receiveShadow=true;return m;
}

function cylinder(THREE,r,depth,material,name,segments=24){
  const g=new THREE.CylinderGeometry(r,r,depth,segments,1,false);
  const m=new THREE.Mesh(g,material);m.name=name||'Cylinder';m.castShadow=true;m.receiveShadow=true;return m;
}

function createScreenCanvas(){
  const canvas=document.createElement('canvas');
  canvas.width=1024;canvas.height=640;
  const ctx=canvas.getContext('2d',{alpha:false});
  return {canvas,ctx};
}

function drawScreen(state,t,active,progress){
  const {canvas,ctx}=state;
  const w=canvas.width,h=canvas.height;
  ctx.fillStyle='#050807';ctx.fillRect(0,0,w,h);

  // Subtle green-black phosphor field: restrained, not HUD-heavy.
  const glow=ctx.createRadialGradient(w*.48,h*.44,20,w*.48,h*.44,w*.68);
  glow.addColorStop(0,'rgba(124,255,184,.085)');
  glow.addColorStop(.55,'rgba(50,140,92,.025)');
  glow.addColorStop(1,'rgba(0,0,0,0)');
  ctx.fillStyle=glow;ctx.fillRect(0,0,w,h);

  const boot=clamp((progress-.03)/.26);
  const on=active?1:boot;
  const flicker=active?(0.97+Math.sin(t*.021)*.015):boot;
  ctx.globalAlpha=clamp(on*flicker);

  ctx.fillStyle='#d6fbe1';
  ctx.font='700 42px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';
  ctx.fillText('MOVX',76,104);
  ctx.font='600 17px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';
  ctx.fillStyle='rgba(214,251,225,.72)';
  ctx.fillText('CREATIVE TERMINAL / MX-2003',78,139);

  const lines=[
    ['SYSTEM', 'VISUAL ENGINE ONLINE'],
    ['INPUT',  'POINTER + SCROLL'],
    ['MODE',   'SOUL OF DESIGN'],
  ];
  ctx.font='600 15px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';
  lines.forEach((row,i)=>{
    const y=236+i*48;
    ctx.fillStyle='rgba(214,251,225,.38)';ctx.fillText(row[0],78,y);
    ctx.fillStyle='rgba(214,251,225,.82)';ctx.fillText(row[1],245,y);
  });

  const load=clamp(progress/.28);
  ctx.fillStyle='rgba(214,251,225,.18)';ctx.fillRect(78,430,868,2);
  ctx.fillStyle='rgba(214,251,225,.82)';ctx.fillRect(78,430,868*load,2);
  ctx.fillStyle='rgba(255,105,42,.95)';ctx.fillRect(78+868*load-2,424,4,14);

  ctx.font='600 13px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';
  ctx.fillStyle='rgba(214,251,225,.42)';
  ctx.fillText(active?'READY / SCROLL TO ENTER':'BOOTING / INITIALIZING',78,478);
  ctx.fillStyle='rgba(214,251,225,.22)';
  ctx.fillText('01 / DEVICE BOOT',790,548);

  // Scanlines + vignette live in texture so the screen reads as real CRT glass.
  ctx.globalAlpha=.14;
  ctx.fillStyle='#000';
  for(let y=0;y<h;y+=4)ctx.fillRect(0,y,w,1);
  ctx.globalAlpha=1;
  const vig=ctx.createRadialGradient(w/2,h*.48,h*.2,w/2,h*.48,w*.62);
  vig.addColorStop(.45,'rgba(0,0,0,0)');vig.addColorStop(1,'rgba(0,0,0,.58)');
  ctx.fillStyle=vig;ctx.fillRect(0,0,w,h);
}

function makeBadgeTexture(THREE){
  const canvas=document.createElement('canvas');canvas.width=512;canvas.height=160;
  const ctx=canvas.getContext('2d');ctx.clearRect(0,0,512,160);
  ctx.fillStyle='#56514a';ctx.font='800 68px Arial, sans-serif';ctx.fillText('MOVX',20,80);
  ctx.fillStyle='#7e776e';ctx.font='600 21px ui-monospace, monospace';ctx.fillText('MX-2003 / CREATIVE TERMINAL',24,119);
  const tex=new THREE.CanvasTexture(canvas);tex.colorSpace=THREE.SRGBColorSpace;tex.needsUpdate=true;return tex;
}

export function createProceduralCRT(THREE,{coarse=false}={}){
  const root=new THREE.Group();root.name='MOVX_CRT_Procedural_v348';
  const body=new THREE.Group();body.name='CRTBody';root.add(body);

  const shellMat=new THREE.MeshStandardMaterial({color:0xd9d3c7,roughness:.62,metalness:.03});
  const shellSideMat=new THREE.MeshStandardMaterial({color:0xc7c0b4,roughness:.7,metalness:.02});
  const graphite=new THREE.MeshStandardMaterial({color:0x282a29,roughness:.48,metalness:.08});
  const graphiteSoft=new THREE.MeshStandardMaterial({color:0x3b3d3b,roughness:.66,metalness:.03});
  const rubber=new THREE.MeshStandardMaterial({color:0x161817,roughness:.82,metalness:0});
  const metal=new THREE.MeshStandardMaterial({color:0x777a78,roughness:.32,metalness:.72});
  const orange=new THREE.MeshStandardMaterial({color:0xff5a18,emissive:0xff5a18,emissiveIntensity:.35,roughness:.42});

  // Main warm ABS enclosure: deliberately deep so it reads as CRT, not flat monitor.
  const shell=roundedBlock(THREE,{w:2.72,h:1.88,d:1.52,r:.18,bevel:.05,segments:4,material:shellMat,name:'Shell'});
  shell.position.z=-.18;body.add(shell);

  // Rear step gives the enclosure a believable deep CRT silhouette.
  const rear=roundedBlock(THREE,{w:2.30,h:1.56,d:.74,r:.16,bevel:.035,segments:3,material:shellSideMat,name:'RearShell'});
  rear.position.set(.03,.02,-1.12);body.add(rear);

  // Front inset + bezel.
  const frontInset=roundedBlock(THREE,{w:2.35,h:1.52,d:.12,r:.14,bevel:.025,segments:3,material:graphiteSoft,name:'FrontInset'});
  frontInset.position.set(-.05,.04,.63);body.add(frontInset);
  const bezel=roundedBlock(THREE,{w:2.08,h:1.28,d:.10,r:.13,bevel:.025,segments:3,material:graphite,name:'ScreenBezel'});
  bezel.position.set(-.11,.10,.715);body.add(bezel);

  const screenState=createScreenCanvas();drawScreen(screenState,0,false,0);
  const screenTex=new THREE.CanvasTexture(screenState.canvas);
  screenTex.colorSpace=THREE.SRGBColorSpace;
  screenTex.minFilter=THREE.LinearFilter;screenTex.magFilter=THREE.LinearFilter;
  const screenMat=new THREE.MeshBasicMaterial({map:screenTex,color:0xffffff,toneMapped:false});
  const screen=new THREE.Mesh(new THREE.PlaneGeometry(1.79,1.00,28,16),screenMat);
  screen.name='ScreenContent';screen.position.set(-.14,.12,.785);body.add(screen);

  // Convex smoked-glass impression: transparent rounded plate floating just above screen.
  const glassMat=new THREE.MeshPhysicalMaterial({
    color:0x92aa9d,roughness:.18,metalness:0,transparent:true,opacity:.22,
    transmission:.34,thickness:.08,ior:1.44,clearcoat:1,clearcoatRoughness:.1,
  });
  const glass=roundedBlock(THREE,{w:1.86,h:1.08,d:.045,r:.11,bevel:.018,segments:4,material:glassMat,name:'ScreenGlass'});
  glass.position.set(-.14,.12,.81);glass.renderOrder=3;body.add(glass);

  // Lower/front control strip.
  const button=cylinder(THREE,.075,.055,graphite,'PowerButton',32);button.rotation.x=Math.PI/2;button.position.set(.91,-.69,.795);body.add(button);
  const led=cylinder(THREE,.025,.035,orange,'StatusLED',24);led.rotation.x=Math.PI/2;led.position.set(.69,-.69,.798);body.add(led);

  // Functional ports.
  for(let i=0;i<3;i++){
    const port=roundedBlock(THREE,{w:i===0?.16:.12,h:.055,d:.035,r:.018,bevel:.006,segments:2,material:rubber,name:`Port_${i+1}`});
    port.position.set(-.91+i*.19,-.70,.79);body.add(port);
  }

  // Small brushed-metal dial for physical product detail.
  const dial=cylinder(THREE,.06,.045,metal,'ControlDial',28);dial.rotation.x=Math.PI/2;dial.position.set(.46,-.69,.80);body.add(dial);

  // Side ventilation: real geometry, concentrated on one side as specified.
  for(let i=0;i<9;i++){
    const vent=box(THREE,.032,.62,.055,rubber,`Vent_A_${i+1}`);
    vent.position.set(1.388,.34-i*.005,-.53+i*.085);vent.rotation.y=.02;body.add(vent);
  }
  for(let i=0;i<5;i++){
    const vent=box(THREE,.028,.34,.05,rubber,`Vent_B_${i+1}`);
    vent.position.set(1.39,-.45,-.44+i*.095);body.add(vent);
  }

  // Feet ground the CRT instead of making it float.
  for(const x of [-.92,.92]){
    const foot=roundedBlock(THREE,{w:.34,h:.14,d:.42,r:.05,bevel:.015,segments:2,material:rubber,name:'Foot'});
    foot.position.set(x,-1.01,-.15);body.add(foot);
  }

  // Recessed rear socket + single cable exit point.
  const socket=roundedBlock(THREE,{w:.42,h:.28,d:.05,r:.045,bevel:.012,segments:2,material:graphite,name:'CablePort'});
  socket.position.set(.52,-.30,-1.505);socket.rotation.y=Math.PI;body.add(socket);
  const cable=cylinder(THREE,.055,.22,rubber,'CableExit',18);cable.rotation.z=Math.PI/2;cable.position.set(.80,-.30,-1.54);body.add(cable);

  // Physical MOVX badge, intentionally small.
  const badgeTex=makeBadgeTexture(THREE);
  const badgeMat=new THREE.MeshBasicMaterial({map:badgeTex,transparent:true,toneMapped:false,depthWrite:false});
  const badge=new THREE.Mesh(new THREE.PlaneGeometry(.62,.19),badgeMat);badge.name='Badge';badge.position.set(-.79,-.58,.805);body.add(badge);

  // Small top seam + side seam make the product less CG-generic.
  const seamMat=new THREE.MeshBasicMaterial({color:0x8d877e,transparent:true,opacity:.32});
  const seamTop=box(THREE,2.15,.012,.012,seamMat,'TopSeam');seamTop.position.set(.02,.925,.36);body.add(seamTop);
  const seamSide=box(THREE,.012,1.25,.012,seamMat,'SideSeam');seamSide.position.set(1.33,.0,.20);body.add(seamSide);

  // Light owned by model: the screen softly spills onto the bezel when powered.
  const screenGlow=new THREE.PointLight(0x8fffc1,0,2.8,2.1);screenGlow.position.set(-.12,.12,1.12);root.add(screenGlow);

  root.rotation.set(-.035,-.12,0);
  root.scale.setScalar(coarse?.91:.96);
  root.userData.movxProcedural=true;
  root.userData.version='v348';

  let lastDraw=-999;
  function update({time=0,progress=0,active=false,pointerX=0,pointerY=0}={}){
    progress=clamp(progress);
    // Product motion stays restrained: no spinning/floating.
    body.rotation.y=(-.045 + progress*.085) + pointerX*.018;
    body.rotation.x=pointerY*-.012;
    body.position.y=Math.sin(time*.00055)*.004;
    const s=(coarse?.91:.96)*(1+progress*.018);
    root.scale.setScalar(s);
    screenGlow.intensity=(active?1.25:.15)*clamp((progress+.08)*2.2);
    orange.emissiveIntensity=active?.95:.28;

    if(time-lastDraw>70){
      drawScreen(screenState,time,active,progress);
      screenTex.needsUpdate=true;
      lastDraw=time;
    }
  }

  function dispose(){
    root.traverse(node=>{
      node.geometry?.dispose?.();
      const mats=Array.isArray(node.material)?node.material:[node.material];
      mats.filter(Boolean).forEach(mat=>{
        for(const value of Object.values(mat))if(value?.isTexture)value.dispose?.();
        mat.dispose?.();
      });
    });
    screenTex.dispose();badgeTex.dispose();
  }

  return {model:root,update,dispose,meta:{kind:'procedural-crt',version:'v348',screenTexture:true}};
}
