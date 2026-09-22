"""Publish canonical site source; the historical archive supplies media only."""
from pathlib import Path, PurePosixPath
import shutil, zipfile, re, subprocess, json
root=Path(__file__).resolve().parents[1]
out=root/'_site'
release='v109-process-art-direction'
if out.exists():shutil.rmtree(out)
shutil.copytree(root/'site',out,ignore=shutil.ignore_patterns('assets','vendor'))
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
 if 'v106-dimensional.mjs' not in text:
  text=text.replace('</body>',f'<script type="module" src="v106-dimensional.mjs?v={release}"></script>\n</body>')
 if 'v107-scroll-sculpture.mjs' not in text:
  text=text.replace('</body>',f'<script type="module" src="v107-scroll-sculpture.mjs?v={release}"></script>\n</body>')
 if 'v108-institutional-depth.mjs' not in text:
  text=text.replace('</body>',f'<script type="module" src="v108-institutional-depth.mjs?v={release}"></script>\n</body>')
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
print(json.dumps({'release':release,'assets':len(list((out/'assets').rglob('*.*'))),'missing':missing}))
