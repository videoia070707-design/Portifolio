"""Publish canonical site source; the historical archive supplies media only."""
from pathlib import Path, PurePosixPath
import shutil, zipfile, re, subprocess, json
root=Path(__file__).resolve().parents[1]
out=root/'_site'
release='v115-5-adaptive-surface-owner'
if out.exists():shutil.rmtree(out)
shutil.copytree(root/'site',out,ignore=shutil.ignore_patterns('assets','vendor'))

# V108 owns camera/rendering and publishes the end-fade signal, but it must not
# also write the canvas opacity directly. Strip that historical writer from the
# canonical runtime so the adaptive v115 owner is the only final surface writer.
v108_runtime=out/'v108-institutional-depth.mjs'
v108_text=v108_runtime.read_text()
legacy_opacity_writer="    canvas.style.opacity=String(.96*edgeFade);\n"
if v108_text.count(legacy_opacity_writer)!=1:
 raise SystemExit('Expected exactly one legacy v108 canvas opacity writer')
v108_runtime.write_text(v108_text.replace(
 legacy_opacity_writer,
 "    // v115 owns final canvas opacity; v108 publishes only the fade signal.\n"
))

# Promote the already-canonical v115 runtime from geometry owner to complete
# Process surface owner. The old cascade contains several !important opacity
# declarations; inline-important is safe now because v108 no longer rewrites it.
# V115 consumes v108's fade signal and caps visual weight at the approved 0.46.
v115_runtime=out/'v115-process-owner.mjs'
v115_text=v115_runtime.read_text()
opacity_anchor="        canvas.style.setProperty('transform-origin','92% 50%','important');\n        canvas.style.setProperty('filter','saturate(.72) contrast(.92) brightness(1.02)','important');\n"
opacity_patch="        canvas.style.setProperty('transform-origin','92% 50%','important');\n        const fadeSignal=parseFloat(getComputedStyle(journey).getPropertyValue('--v108-process-canvas-o'));\n        const ownedOpacity=Number.isFinite(fadeSignal)?Math.min(.46,Math.max(0,fadeSignal)):.46;\n        canvas.style.setProperty('opacity',ownedOpacity.toFixed(4),'important');\n        canvas.style.setProperty('transition','none','important');\n        canvas.style.setProperty('animation','none','important');\n        canvas.style.setProperty('filter','saturate(.72) contrast(.92) brightness(1.02)','important');\n"
if v115_text.count(opacity_anchor)!=1:
 raise SystemExit('Expected exactly one v115 surface ownership anchor')
v115_text=v115_text.replace(opacity_anchor,opacity_patch)
clear_anchor="      clear(canvas,['background','clip-path','-webkit-clip-path','-webkit-mask-image','mask-image','transform','transform-origin','filter','mix-blend-mode']);\n"
clear_patch="      clear(canvas,['background','clip-path','-webkit-clip-path','-webkit-mask-image','mask-image','transform','transform-origin','opacity','transition','animation','filter','mix-blend-mode']);\n"
if v115_text.count(clear_anchor)!=1:
 raise SystemExit('Expected exactly one v115 surface cleanup anchor')
v115_runtime.write_text(v115_text.replace(clear_anchor,clear_patch))

# Cache-bust authoritative stability layers. Build-only guards and the current
# dimensional layers load last so historical experiments cannot override them.
for html in out.glob('*.html'):
 text=html.read_text()
 text=re.sub(r'layout-integrity\.css\?v=[^\"\']+',f'layout-integrity.css?v={release}',text)
 if 'v104-case-clarity.css' not in text:
  text=text.replace('</head>',f'<link rel="stylesheet" href="v104-case-clarity.css?v={release}">\n</head>')
 if 'v105-project-preview-integrity.css' not in text:
  text=text.replace('</head>',f'<link rel="stylesheet" href="v105-project-preview-integrity.css?v={release}">\n</head>')
 if 'v106-dimensional.css' not in text:
  text=text.replace('</head>',f'<link rel="stylesheet" href="v106-dimensional.css?v={release}">\n</head>')
 if 'v107-scroll-sculpture.css' not in text:
  text=text.replace('</head>',f'<link rel="stylesheet" href="v107-scroll-sculpture.css?v={release}">\n</head>')
 if 'v108-institutional-depth.css' not in text:
  text=text.replace('</head>',f'<link rel="stylesheet" href="v108-institutional-depth.css?v={release}">\n</head>')
 if 'v108-process-structure.css' not in text:
  text=text.replace('</head>',f'<link rel="stylesheet" href="v108-process-structure.css?v={release}">\n</head>')
 if 'v109-process-art-direction.css' not in text:
  text=text.replace('</head>',f'<link rel="stylesheet" href="v109-process-art-direction.css?v={release}">\n</head>')
 if 'v110-process-legibility.css' not in text:
  text=text.replace('</head>',f'<link rel="stylesheet" href="v110-process-legibility.css?v={release}">\n</head>')
 if 'v111-process-cleanroom.css' not in text:
  text=text.replace('</head>',f'<link rel="stylesheet" href="v111-process-cleanroom.css?v={release}">\n</head>')
 if 'v112-process-polish.css' not in text:
  text=text.replace('</head>',f'<link rel="stylesheet" href="v112-process-polish.css?v={release}">\n</head>')
 if 'v115-process-owner.css' not in text:
  text=text.replace('</head>',f'<link rel="stylesheet" href="v115-process-owner.css?v={release}">\n</head>')
 if 'v106-dimensional.mjs' not in text:
  text=text.replace('</body>',f'<script type="module" src="v106-dimensional.mjs?v={release}"></script>\n</body>')
 if 'v107-scroll-sculpture.mjs' not in text:
  text=text.replace('</body>',f'<script type="module" src="v107-scroll-sculpture.mjs?v={release}"></script>\n</body>')
 if 'v108-institutional-depth.mjs' not in text:
  text=text.replace('</body>',f'<script type="module" src="v108-institutional-depth.mjs?v={release}"></script>\n</body>')
 if 'v110-process-legibility.mjs' not in text:
  text=text.replace('</body>',f'<script type="module" src="v110-process-legibility.mjs?v={release}"></script>\n</body>')
 # v111 runtime is intentionally retired in v115. Its CSS remains as the
 # editorial presentation layer; v115 owns adaptive lifecycle and field state.
 if 'v115-process-owner.mjs' not in text:
  text=text.replace('</body>',f'<script type="module" src="v115-process-owner.mjs?v={release}"></script>\n</body>')
 html.write_text(text)
archive=next(root.glob('MOVX_Portfolio_v18*.zip'))
with zipfile.ZipFile(archive) as z:
 for info in z.infolist():
  parts=PurePosixPath(info.filename).parts
  if 'assets' not in parts or info.is_dir():continue
  relative=PurePosixPath(*parts[parts.index('assets'):])
  if '..' in relative.parts:raise ValueError('Unsafe asset path')
  target=out/relative;target.parent.mkdir(parents=True,exist_ok=True)
  target.write_bytes(z.read(info))
# Local dependencies have pinned versions in package-lock.json.
(out/'vendor').mkdir(exist_ok=True)
for name in ['gsap.min.js','ScrollTrigger.min.js']:
 shutil.copy2(root/'node_modules/gsap/dist'/name,out/'vendor'/name)
for name in ['three.module.min.js','three.core.min.js']:
 shutil.copy2(root/'node_modules/three/build'/name,out/'vendor'/name)
missing=[]
for f in out.glob('*.html'):
 for ref in re.findall(r'(?:src|href)=[\"\']([^\"\']+)',f.read_text()):
  ref=ref.split('?')[0].split('#')[0]
  if not ref or ':' in ref or ref.startswith('//'):continue
  if not (out/ref).exists():missing.append((f.name,ref))
for f in [*out.glob('*.js'),*out.glob('*.mjs')]:
 subprocess.run(['node','--check',str(f)],check=True,capture_output=True)
if missing:raise SystemExit('Missing references: '+str(missing))
if 'canvas.style.opacity=String(.96*edgeFade)' in v108_runtime.read_text():
 raise SystemExit('Legacy Process opacity writer survived canonical build')
if "canvas.style.setProperty('opacity',ownedOpacity.toFixed(4),'important')" not in v115_runtime.read_text():
 raise SystemExit('Adaptive v115 Process opacity owner was not installed')
print(json.dumps({'release':release,'assets':len(list((out/'assets').rglob('*.*'))),'missing':missing,'process_surface_owner':'v115'}))
