"""Install MOVX v136 procedural fluid morph hero.

Replaces only the old static cover visual stage with a scroll-driven procedural 3D hero.
The existing hero index and all Scroll World / archive / v135 sections remain intact.
"""
from pathlib import Path
import json, shutil

root=Path(__file__).resolve().parents[1]
out=root/'_site'
release='v136-fluid-morph'
css='v136-fluid-morph.css'
runtime='v136-fluid-morph.mjs'

for name in (css,runtime):
    src=root/'site'/name
    dst=out/name
    if not src.exists():
        raise SystemExit(f'MOVX v136 missing source file: {src}')
    shutil.copy2(src,dst)

vendor=out/'vendor'
vendor.mkdir(parents=True,exist_ok=True)
three_candidates=[root/'node_modules'/'three'/'build'/'three.module.min.js',root/'node_modules'/'three'/'build'/'three.module.js']
three_src=next((p for p in three_candidates if p.exists()),None)
if not three_src:
    raise SystemExit('MOVX v136 could not find pinned Three.js in node_modules')
shutil.copy2(three_src,vendor/'three.module.js')

fragment='''<section class="v136-fluid-hero" id="fluidHero" aria-label="MOVX — matéria em transformação">
  <div class="v136-fluid-hero__sticky">
    <div class="v136-fluid-hero__glow" aria-hidden="true"></div>
    <canvas class="v136-fluid-hero__canvas" aria-hidden="true"></canvas>
    <div class="v136-fluid-hero__copy">
      <div class="v136-fluid-hero__kicker">SCROLL / MORPH / MOVX</div>
      <h1>IDEIAS EM <span>MOVIMENTO.</span></h1>
      <p>Uma única matéria muda de linguagem conforme você avança: líquido, anel, torre e infinito — sem trocar de cena.</p>
    </div>
    <div class="v136-fluid-hero__state-readout" aria-live="polite"><small>FORMA ATUAL</small><strong>LIQUID</strong><em>01 / 04</em></div>
    <div class="v136-fluid-hero__states" aria-hidden="true">
      <div class="v136-fluid-state is-active"><span>01</span><strong>LIQUID</strong></div>
      <div class="v136-fluid-state"><span>02</span><strong>RING</strong></div>
      <div class="v136-fluid-state"><span>03</span><strong>TOWER</strong></div>
      <div class="v136-fluid-state"><span>04</span><strong>INFINITY</strong></div>
    </div>
    <div class="v136-fluid-hero__scroll" aria-hidden="true">SCROLL TO MORPH</div>
  </div>
</section>'''

installed=[]
for name in ('index.html','latest.html','social-media.html'):
    path=out/name
    if not path.exists():
        continue
    text=path.read_text()
    marker='<section class="social-cover-art"'
    if marker not in text:
        continue
    if 'class="v136-fluid-hero"' not in text:
        idx=text.index(marker)
        text=text[:idx]+fragment+'\n'+text[idx:]
    href=f'{css}?v={release}'
    src=f'{runtime}?v={release}'
    if href not in text:
        text=text.replace('</head>',f'<link rel="stylesheet" href="{href}">\n</head>',1)
    if src not in text:
        text=text.replace('</body>',f'<script type="module" src="{src}"></script>\n</body>',1)
    text=text.replace('href="#heroTop">MOVX','href="#fluidHero">MOVX',1)
    path.write_text(text)
    installed.append(name)

required=[out/css,out/runtime,vendor/'three.module.js']
missing=[str(p) for p in required if not p.exists()]
if missing or len(installed)<3:
    raise SystemExit(f'MOVX v136 invalid install: missing={missing}; pages={installed}')

print(json.dumps({'release':release,'pages':installed,'hero':'procedural fixed-topology LIQUID -> RING -> TOWER -> INFINITY','three':'pinned npm build copied locally','protected':['hero-index','Scroll World','living archive','archive directory','v135 about/services'],'binary_asset':'none; geometry is generated deterministically in-browser'}))
