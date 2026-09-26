"""Install MOVX v348 Scene-01 3D runtime after v321 production promotion.

Copies Three.js GLTFLoader and the procedural CRT module, then injects the
single-model runtime. Production WebGL remains gated to `boot-tv`; when the
final Tripo CRT GLB is absent the procedural CRT is rendered instead.
"""
from pathlib import Path
import base64, json, os, re, shutil, struct

root=Path(__file__).resolve().parents[1]
out=root/'_site'
release='v322-unified-glb-runtime'
cache='v348-crt-procedural'
css='v322-glb-runtime.css'
runtime='v322-glb-runtime.mjs'
procedural='v348-crt-procedural.mjs'

for name in (css,runtime,procedural):
    src=root/'site'/name
    dst=out/name
    if not src.exists():raise SystemExit(f'MOVX v348 missing source: {src}')
    shutil.copy2(src,dst)

three_dst=out/'vendor'/'three.module.js'
if not three_dst.exists():raise SystemExit('MOVX v348 requires local vendor/three.module.js from v136')
addons_src=root/'node_modules'/'three'/'examples'/'jsm'
entry=addons_src/'loaders'/'GLTFLoader.js'
if not entry.exists():raise SystemExit('MOVX v348 could not find pinned GLTFLoader.js')
addons_dst=out/'vendor'/'three-addons'
if addons_dst.exists():shutil.rmtree(addons_dst)

IMPORT_RE=re.compile(r'(?P<prefix>\bfrom\s+|\bimport\s+)(?P<quote>[\'\"])(?P<spec>[^\'\"]+)(?P=quote)')
visited=set()

def inside(path,parent):
    try:path.relative_to(parent);return True
    except ValueError:return False

def copy_module(src):
    src=src.resolve()
    if src in visited:return
    if not inside(src,addons_src.resolve()):raise SystemExit(f'MOVX v348 addon escaped source root: {src}')
    if not src.exists():raise SystemExit(f'MOVX v348 addon dependency missing: {src}')
    visited.add(src)
    rel=src.relative_to(addons_src.resolve())
    dst=addons_dst/rel
    dst.parent.mkdir(parents=True,exist_ok=True)
    text=src.read_text()
    def repl(match):
        spec=match.group('spec')
        if spec=='three':
            local=os.path.relpath(three_dst,dst.parent).replace(os.sep,'/')
            if not local.startswith('.'):local='./'+local
            spec=local
        elif spec.startswith('.'):
            dep=(src.parent/spec).resolve()
            if dep.suffix=='':dep=dep.with_suffix('.js')
            if dep.suffix=='.js' and inside(dep,addons_src.resolve()):copy_module(dep)
        return f"{match.group('prefix')}{match.group('quote')}{spec}{match.group('quote')}"
    dst.write_text(IMPORT_RE.sub(repl,text))

copy_module(entry)
loader_dst=addons_dst/'loaders'/'GLTFLoader.js'
if not loader_dst.exists():raise SystemExit('MOVX v348 loader copy failed')
if re.search(r"from\s+['\"]three['\"]",loader_dst.read_text()):raise SystemExit('MOVX v348 bare Three import survived')

href=f'{css}?v={cache}'
src=f'{runtime}?v={cache}'
installed=[]
for name in ('index.html','latest.html'):
    path=out/name
    text=path.read_text()
    if 'data-movx-production="v321-production-storyboard"' not in text:
        raise SystemExit(f'MOVX v348 expected v321 production page: {name}')
    if href not in text:text=text.replace('</head>',f'<link rel="stylesheet" href="{href}">\n</head>',1)
    if src not in text:text=text.replace('</body>',f'<script type="module" src="{src}"></script>\n</body>',1)
    text=text.replace('data-storyboard="v320"',f'data-storyboard="v320" data-glb-runtime="{release}" data-crt-runtime="v348-procedural"',1)
    path.write_text(text);installed.append(name)

# Tiny non-indexed triangle fixture for the GLB replacement-path QA.
positions=[-0.6,-0.45,0.0, 0.6,-0.45,0.0, 0.0,0.65,0.0]
buf=struct.pack('<9f',*positions)
data=base64.b64encode(buf).decode()
fixture={
 'asset':{'version':'2.0','generator':'MOVX v348 QA'},
 'buffers':[{'uri':'data:application/octet-stream;base64,'+data,'byteLength':len(buf)}],
 'bufferViews':[{'buffer':0,'byteOffset':0,'byteLength':len(buf),'target':34962}],
 'accessors':[{'bufferView':0,'byteOffset':0,'componentType':5126,'count':3,'type':'VEC3','min':[-0.6,-0.45,0.0],'max':[0.6,0.65,0.0]}],
 'meshes':[{'primitives':[{'attributes':{'POSITION':0},'mode':4}]}],
 'nodes':[{'mesh':0}],
 'scenes':[{'nodes':[0]}],
 'scene':0,
}
(out/'qa-v322-model.gltf').write_text(json.dumps(fixture,separators=(',',':')))

print(json.dumps({
 'release':release,'cache':cache,'pages':installed,'addon_modules':len(visited),
 'loader':'vendor/three-addons/loaders/GLTFLoader.js','three':'vendor/three.module.js',
 'procedural':procedural,'fixture':'qa-v322-model.gltf',
 'mode':'boot-tv only; procedural CRT until final GLB'
}))
