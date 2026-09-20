from pathlib import Path
import sys

root = Path(sys.argv[1] if len(sys.argv) > 1 else '.')
script_path = root / 'script.js'
script = script_path.read_text(encoding='utf-8')

marker = '/* MOVX v38 build optimization — scroll work throttled and case progress compositor-scheduled. */'
if marker not in script:
    script = marker + '\n' + script

# 1) v30 still performed all layout reads directly inside every native scroll event.
# Keep the exact target logic, but schedule it once per animation frame.
old = """    addEventListener('scroll', setTargets, { passive: true });
    addEventListener('resize', setTargets, { passive: true });
    addEventListener('load', setTargets, { once: true });
    setTargets();
"""
new = """    let v38TargetsRaf = 0;
    const scheduleTargets = () => {
      if (v38TargetsRaf) return;
      v38TargetsRaf = requestAnimationFrame(() => {
        v38TargetsRaf = 0;
        setTargets();
      });
    };
    addEventListener('scroll', scheduleTargets, { passive: true });
    addEventListener('resize', scheduleTargets, { passive: true });
    addEventListener('load', scheduleTargets, { once: true });
    setTargets();
"""
if old in script:
    script = script.replace(old, new, 1)
elif 'const scheduleTargets = () =>' not in script:
    raise SystemExit('v38 optimizer: v30 scroll hook not found')

# 2) Case progress used to write style on every viewer scroll event. Throttle it
# to one compositor-friendly transform update per frame.
old2 = """  viewer?.addEventListener('scroll', updateCaseProgress, {passive:true});
"""
new2 = """  let v38CaseProgressRaf = 0;
  const scheduleCaseProgress = () => {
    if(v38CaseProgressRaf) return;
    v38CaseProgressRaf = requestAnimationFrame(() => {
      v38CaseProgressRaf = 0;
      updateCaseProgress();
    });
  };
  viewer?.addEventListener('scroll', scheduleCaseProgress, {passive:true});
"""
if old2 in script:
    script = script.replace(old2, new2, 1)
elif 'const scheduleCaseProgress = () =>' not in script:
    raise SystemExit('v38 optimizer: case progress hook not found')

# 3) v39 registered/ran refresh helpers before its RAF variable was initialized.
# IntersectionObserver may synchronously trigger schedule(), producing a temporal
# dead-zone ReferenceError and disabling the parallax/depth runtime. Initialize the
# scheduler before any refresh/observer callback can reach it.
refresh_calls = """    refreshProjects();
    refreshNiches();
    refreshCaseFrames();
"""
if refresh_calls in script and "    let raf = 0;\n\n    refreshProjects();" not in script:
    script = script.replace(refresh_calls, "    let raf = 0;\n\n" + refresh_calls, 1)

late_raf = """    let raf = 0;
    let lastScrollY = scrollY;
"""
if late_raf in script:
    script = script.replace(late_raf, "    let lastScrollY = scrollY;\n", 1)

if 'MOVX v39 — perceptible parallax + 3D scroll runtime' in script:
    raf_pos = script.find('    let raf = 0;')
    refresh_pos = script.find('    refreshProjects();')
    if raf_pos < 0 or refresh_pos < 0 or raf_pos > refresh_pos:
        raise SystemExit('v51 optimizer: v39 RAF still initializes after refresh callbacks')

# 4) v53 bridge: let the Process DOM physically settle out of the v52 WebGL corridor.
# It does not move individual copy lines; it transforms only the process group during entry,
# then returns to a perfectly static/readable layout once the chapter is established.
bridge_marker = '/* MOVX v53 — process handoff bridge */'
if bridge_marker not in script:
    bridge_runtime = r'''

/* MOVX v53 — process handoff bridge */
(() => {
  'use strict';
  const root = document.documentElement;
  const reduced = new URLSearchParams(location.search).has('static') || matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced) return;

  let bound = false;
  const clamp = (v,a=0,b=1) => Math.min(b,Math.max(a,v));
  const smooth = t => t*t*(3-2*t);

  function bind(){
    if(bound) return true;
    const process = document.querySelector('#process, .process-section');
    const list = process?.querySelector('.process-list');
    if(!process || !list) return false;
    bound = true;
    root.classList.add('movx-v53-bridge');
    process.classList.add('v53-process-bridge');

    let raf = 0;
    const paint = () => {
      raf = 0;
      const rect = process.getBoundingClientRect();
      const raw = clamp((innerHeight - rect.top) / Math.max(1, innerHeight * .92));
      const entry = smooth(raw);
      const inv = 1 - entry;
      process.style.setProperty('--v53-entry', entry.toFixed(4));
      process.style.setProperty('--v53-list-y', `${(inv*62).toFixed(2)}px`);
      process.style.setProperty('--v53-list-z', `${(-inv*150).toFixed(2)}px`);
      process.style.setProperty('--v53-list-rx', `${(inv*7.5).toFixed(2)}deg`);
      process.style.setProperty('--v53-grid-o', `${clamp(inv*1.12,0,1).toFixed(4)}`);
      process.style.setProperty('--v53-title-o', `${clamp(.55+entry*.45,0,1).toFixed(4)}`);
    };
    const schedule = () => { if(!raf) raf = requestAnimationFrame(paint); };
    addEventListener('scroll',schedule,{passive:true});
    addEventListener('resize',schedule,{passive:true});
    addEventListener('load',schedule,{once:true});
    document.addEventListener('visibilitychange',()=>{ if(!document.hidden) schedule(); },{passive:true});
    paint();
    return true;
  }

  if(!bind() && 'MutationObserver' in window){
    const observer = new MutationObserver(()=>{ if(bind()) observer.disconnect(); });
    observer.observe(document.documentElement,{childList:true,subtree:true});
  }
})();
'''
    script += bridge_runtime

script_path.write_text(script, encoding='utf-8')
print('MOVX v38/v53 runtime audit applied: throttled legacy scroll work + v39 RAF repair + Process spatial handoff bridge')
