const {chromium}=require('playwright');
const fs=require('node:fs');
const path=require('node:path');

const models=['movx-camera.glb'];

const viewer=`<!doctype html>
<html><head><meta charset="utf-8"><style>
html,body{margin:0;width:100%;height:100%;overflow:hidden;background:#d8d5cf}
body:before{content:'';position:fixed;inset:0;background:radial-gradient(circle at 50% 38%,#f5f2ec 0,#d8d5cf 62%,#aaa69f 100%)}
canvas{position:fixed;inset:0;width:100%;height:100%;display:block}
.label{position:fixed;left:18px;bottom:15px;z-index:2;padding:7px 10px;background:#111;color:#fff;font:12px/1.2 monospace;letter-spacing:.04em}
</style></head><body><div class="label" id="label"></div><script type="module">
import * as THREE from './vendor/three.module.js';
import {GLTFLoader} from './vendor/three-addons/loaders/GLTFLoader.js';
const q=new URLSearchParams(location.search);const src=q.get('src');const yaw=Number(q.get('yaw')||0);
document.querySelector('#label').textContent=src||'missing';
const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,preserveDrawingBuffer:true});
renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5));renderer.setSize(innerWidth,innerHeight);renderer.setClearColor(0,0);renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;if('outputColorSpace' in renderer)renderer.outputColorSpace=THREE.SRGBColorSpace;document.body.appendChild(renderer.domElement);
const scene=new THREE.Scene();const camera=new THREE.PerspectiveCamera(28,innerWidth/innerHeight,.01,100);camera.position.set(0,.04,4.7);camera.lookAt(0,0,0);
scene.add(new THREE.HemisphereLight(0xffffff,0x35322e,2.4));
const key=new THREE.DirectionalLight(0xffffff,4.2);key.position.set(3,4,5);scene.add(key);
const fill=new THREE.DirectionalLight(0xffa66a,1.4);fill.position.set(-4,1,3);scene.add(fill);
const rim=new THREE.DirectionalLight(0xd9e5ff,.9);rim.position.set(-2,3,-4);scene.add(rim);
const group=new THREE.Group();scene.add(group);group.rotation.y=yaw;
const loader=new GLTFLoader();
try{
 const gltf=await loader.loadAsync(src);const model=gltf.scene||gltf.scenes?.[0];if(!model)throw new Error('no scene');
 model.updateMatrixWorld(true);
 const meshDetails=[];
 model.traverse((n)=>{if(!n.isMesh)return;const b=new THREE.Box3().setFromObject(n);const c=b.getCenter(new THREE.Vector3());const s=b.getSize(new THREE.Vector3());const mats=(Array.isArray(n.material)?n.material:[n.material]).filter(Boolean);meshDetails.push({name:n.name||'',parent:n.parent?.name||'',materials:mats.map(m=>m.name||''),center:[c.x,c.y,c.z],size:[s.x,s.y,s.z]});});
 window.__meshDetails=meshDetails;
 const box=new THREE.Box3().setFromObject(model);const center=box.getCenter(new THREE.Vector3());const size=box.getSize(new THREE.Vector3());model.position.sub(center);const max=Math.max(size.x,size.y,size.z,.001);model.scale.multiplyScalar(2.45/max);model.updateMatrixWorld(true);group.add(model);
 let meshes=0,triangles=0;model.traverse(n=>{if(n.isMesh){meshes++;const g=n.geometry;const count=g?.index?.count??g?.attributes?.position?.count??0;triangles+=Math.floor(count/3)}});
 document.documentElement.dataset.ready='1';document.documentElement.dataset.meshes=String(meshes);document.documentElement.dataset.triangles=String(triangles);document.documentElement.dataset.sx=String(size.x);document.documentElement.dataset.sy=String(size.y);document.documentElement.dataset.sz=String(size.z);
 function frame(){renderer.render(scene,camera);requestAnimationFrame(frame)}frame();
}catch(e){document.documentElement.dataset.error=String(e?.message||e);document.documentElement.dataset.ready='error'}
</script></body></html>`;

(async()=>{
  const out=path.resolve('_site');
  const srcDir=path.resolve('site/models');
  const diagDir=path.join(out,'diag-models');
  fs.mkdirSync(diagDir,{recursive:true});
  for(const name of models){const src=path.join(srcDir,name);if(fs.existsSync(src))fs.copyFileSync(src,path.join(diagDir,name));}
  fs.writeFileSync(path.join(out,'qa-model-view.html'),viewer);
  const browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-webgl','--ignore-gpu-blocklist']});
  const report=[];
  try{
    for(const name of models){
      if(!fs.existsSync(path.join(diagDir,name)))continue;
      const page=await browser.newPage({viewport:{width:900,height:700},deviceScaleFactor:1});
      const url='http://127.0.0.1:4173/qa-model-view.html?src='+encodeURIComponent('diag-models/'+name)+'&yaw=0';
      await page.goto(url,{waitUntil:'domcontentloaded',timeout:30000});
      await page.waitForFunction(()=>document.documentElement.dataset.ready==='1'||document.documentElement.dataset.ready==='error',null,{timeout:30000});
      const state=await page.evaluate(()=>({ready:document.documentElement.dataset.ready,error:document.documentElement.dataset.error||null,meshes:Number(document.documentElement.dataset.meshes||0),triangles:Number(document.documentElement.dataset.triangles||0),size:[Number(document.documentElement.dataset.sx||0),Number(document.documentElement.dataset.sy||0),Number(document.documentElement.dataset.sz||0)],meshDetails:window.__meshDetails||[]}));
      report.push({name,view:'front',...state});
      if(state.ready==='1')await page.screenshot({path:path.join(out,'qa-model-movx-camera-front.png'),fullPage:false});
      await page.close();
    }
  }finally{await browser.close()}
  fs.writeFileSync(path.join(out,'qa-model-identification.json'),JSON.stringify(report,null,2));
  console.log(JSON.stringify({qa:'identify-camera-crt-cluster',models:report}));
})().catch(e=>{console.error(e);process.exit(1)});
