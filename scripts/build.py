"""Publish canonical site source; the historical archive supplies media only."""
from pathlib import Path, PurePosixPath
import shutil, zipfile, re, subprocess, json
root=Path(__file__).resolve().parents[1]
out=root/'_site'
if out.exists():shutil.rmtree(out)
shutil.copytree(root/'site',out,ignore=shutil.ignore_patterns('assets','vendor'))
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
print(json.dumps({'release':'v102-layout-integrity','assets':len(list((out/'assets').rglob('*.*'))),'missing':missing}))
