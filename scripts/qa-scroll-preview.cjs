// Event-driven regression checks against the actual scroll-film runtime.
const vm=require('node:vm');
const fs=require('node:fs');
const assert=require('node:assert/strict');
const code=fs.readFileSync('site/v116-scroll-film.mjs','utf8');
class Target extends EventTarget { emit(type){this.dispatchEvent(new Event(type))} }
const video=new Target();let current=0;const seeks=[];
Object.assign(video,{dataset:{src:'media/movx-crt-scroll.mp4'},readyState:0,duration:9.733333,seeking:false,src:'',pause(){},load(){},getAttribute(k){return this[k]||null},removeAttribute(k){this[k]='';this.readyState=0;this.seeking=false}});
Object.defineProperty(video,'currentTime',{get(){return current},set(v){assert.equal(this.seeking,false,'Must not interrupt an in-flight seek');current=v;this.seeking=true;seeks.push(v)}});
let y=0;const values=new Map();
const section={dataset:{},offsetHeight:4200,style:{setProperty:(k,v)=>values.set(k,v),removeProperty:k=>values.delete(k)},querySelector:()=>video,getBoundingClientRect:()=>({top:-y})};
const document=new Target();Object.assign(document,{hidden:false,documentElement:{dataset:{}},querySelector:()=>section,fonts:{ready:Promise.resolve()}});
const window=new Target();const reduced=new Target();reduced.matches=false;const mobile=new Target();mobile.matches=false;
const frames=new Map();let id=0,intersection;
const context={document,window,location:{search:''},matchMedia:q=>q.includes('reduced')?reduced:mobile,innerHeight:1000,AbortController,URLSearchParams,requestAnimationFrame:fn=>{frames.set(++id,fn);return id},cancelAnimationFrame:n=>frames.delete(n),IntersectionObserver:class{constructor(fn){intersection=fn}observe(){}disconnect(){}},ResizeObserver:class{observe(){}disconnect(){}}};
vm.runInNewContext(code,context);
function flush(){for(const [id,fn]of [...frames]){frames.delete(id);fn()}}
function scroll(p){y=p*3200;window.emit('scroll');flush()}
function finish(){video.seeking=false;video.readyState=2;video.emit('seeked')}
intersection([{isIntersecting:true}]);flush();
assert.equal(video.src,video.dataset.src);
video.readyState=1;video.emit('loadedmetadata');flush();assert.equal(seeks.length,1);assert.equal(seeks[0],.6);
scroll(.3);scroll(.7);assert.equal(seeks.length,1,'Scroll bursts must queue only the latest target');
finish();assert.equal(seeks.length,2);assert.ok(seeks[1]>5,'Latest target should win');finish();
const forward=video.currentTime;scroll(.1);finish();assert.ok(video.currentTime<forward,'Reverse scroll must seek backward');
scroll(1);finish();assert.ok(video.currentTime<video.duration);assert.equal(section.dataset.v116Phase,'archive');assert.equal(values.get('--v116-opacity'),'0.0000');
reduced.matches=true;reduced.emit('change');flush();assert.equal(section.dataset.v116Mode,'static');assert.equal(video.src,'');assert.equal(values.size,0);
reduced.matches=false;reduced.emit('change');flush();assert.equal(section.dataset.v116Mode,'scrub');assert.equal(video.src,video.dataset.src);
video.readyState=1;video.emit('loadedmetadata');flush();finish();
mobile.matches=true;mobile.emit('change');flush();assert.equal(section.dataset.v116Viewport,'mobile');
document.hidden=true;document.emit('visibilitychange');const before=seeks.length;scroll(.2);assert.equal(seeks.length,before,'Hidden page must not seek');
document.hidden=false;document.emit('visibilitychange');flush();finish();
video.emit('error');flush();assert.equal(section.dataset.v116Mode,'poster');assert.equal(values.size,0);
window.emit('pagehide');const stopped=seeks.length;scroll(.8);assert.equal(seeks.length,stopped);
console.log('PASS: metadata, latest-target coalescing, forward/reverse, final frame, reduced-motion release/resume, mobile mode, visibility, media failure, teardown');
