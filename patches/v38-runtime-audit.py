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

script_path.write_text(script, encoding='utf-8')
print('MOVX v38/v51 runtime audit applied: throttled scroll work + v39 RAF initialization repaired')
