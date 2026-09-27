"""MOVX v353 — stronger portfolio voice + visible cinematic motion.

This pass deliberately leaves the approved standalone CRT GLB untouched.
It updates production copy, embeds the small motion stylesheet, and loads a
native-WAAPI/RAF motion runtime after all storyboard/model installers.
"""
from pathlib import Path
import json, shutil

root=Path(__file__).resolve().parents[1]
out=root/'_site'
css_src=root/'site'/'v353-motion.css'
js_src=root/'site'/'v353-motion.js'
js_out=out/'v353-motion.js'
release='v353-cinematic-motion'

if not css_src.exists() or not js_src.exists():
    raise SystemExit('MOVX v353 motion source files are missing')
if css_src.stat().st_size>12_000 or js_src.stat().st_size>18_000:
    raise SystemExit('MOVX v353 motion layer exceeded its lightweight budget')
shutil.copy2(js_src,js_out)
css=css_src.read_text()

replacements=[
    (
      '<div class="eyebrow">CREATIVE STUDIO / BR</div><h1>O SITE<br>ACORDA<br>COM VOCÊ</h1><p class="copy">Uma entrada física para um universo criativo. O primeiro scroll liga a experiência e abre o sistema MOVX.</p>',
      '<div class="eyebrow">MOVX / CREATIVE STUDIO / BR</div><h1 class="boot-title"><span>IDEIAS</span><span>NÃO FICAM</span><span>PARADAS</span></h1><p class="copy">Direção de arte, motion, IA e experiências digitais para marcas que não querem parecer com todo mundo.</p>'
    ),
    (
      '<div class="boot-tags"><span class="tag">IDEIAS</span><span class="tag">PESSOAS</span><span class="tag">PROJETOS</span><span class="tag">MOVIMENTO</span></div>',
      '<div class="boot-tags"><span class="tag">DIREÇÃO</span><span class="tag">MOTION</span><span class="tag">AI</span><span class="tag">DIGITAL</span></div>'
    ),
    (
      '<h1 class="display">IDEIAS<br>GANHAM<br><span class="accent">FORMA</span></h1><p class="copy">Direção de arte, motion, AI e experiências digitais para marcas que querem presença real.</p>',
      '<h1 class="display">FORMA<br>COM<br><span class="accent">INTENÇÃO</span></h1><p class="copy">Conceito, imagem e movimento trabalhando juntos para transformar atenção em presença de marca.</p>'
    ),
    ('<div class="tunnel-copy" data-reveal>MAIS<br>QUE<br>PROJETOS</div><div class="tunnel-side" data-reveal>UM<br>UNIVERSO<br>CRIATIVO</div>',
     '<div class="tunnel-copy" data-reveal>ENTRE<br>NO<br>SISTEMA</div><div class="tunnel-side" data-reveal>EXPLORE<br>O<br>MOVX</div>'),
    ('<p class="copy">Role para atravessar os projetos. Clique em qualquer case para abrir todas as peças.</p>',
     '<p class="copy">Role pelos cases. Entre nos projetos. Veja a lógica por trás de cada decisão visual.</p>'),
    ('<h2>CADA IDEIA<br>PEDE UMA<br>LINGUAGEM</h2><p class="copy">Do conceito ao resultado, unimos direção, motion, inteligência artificial e experiências digitais em um fluxo único.</p>',
     '<h2>CADA PROJETO<br>PEDE UMA<br>LINGUAGEM</h2><p class="copy">Direção de arte, motion, IA e interfaces entram quando o conceito pede — não como efeito decorativo.</p>'),
    ('<p class="copy">Um espaço livre para explorar ideias, brincar com ferramentas e descobrir novos caminhos.</p>',
     '<p class="copy">Um espaço para testar linguagem, interação e movimento sem transformar experimentação em ruído.</p>'),
    ('<p class="copy">Um estúdio onde arte, tecnologia e criatividade se encontram.</p>',
     '<p class="copy">Arte, tecnologia e processo no mesmo espaço — cada ferramenta existe para empurrar a ideia mais longe.</p>'),
    ('<p class="copy">Ideias, tecnologia e ferramentas só ganham vida com pessoas que realmente se importam com o que fazem.</p>',
     '<p class="copy">Ferramentas aceleram. Repertório, intenção e decisão humana dão direção ao trabalho.</p>'),
    ('<p class="copy">Vamos transformar sua ideia em algo real.</p>',
     '<p class="copy">Se existe uma ideia que precisa ganhar presença, movimento ou forma, começamos por aí.</p>'),
]

style_tag=f'<style data-v353-motion="{release}">\n{css}\n</style>'
script_tag=f'<script type="module" data-v353-motion-runtime="{release}">import("./v353-motion.js?v={release}");</script>'
installed=[]
for name in ('index.html','latest.html'):
    path=out/name
    text=path.read_text()
    for old,new in replacements:
        if old not in text:
            raise SystemExit(f'MOVX v353 expected copy contract missing in {name}: {old[:72]}')
        text=text.replace(old,new,1)
    if 'data-motion-layer=' not in text:
        text=text.replace('<html class=',f'<html data-motion-layer="{release}" class=',1)
    if 'data-v353-motion=' not in text:
        text=text.replace('</head>',style_tag+'\n</head>',1)
    if 'data-v353-motion-runtime=' not in text:
        text=text.replace('</body>',script_tag+'\n</body>',1)
    path.write_text(text)
    installed.append(name)

for name in installed:
    text=(out/name).read_text()
    if 'O SITE<br>ACORDA<br>COM VOCÊ' in text:
        raise SystemExit('MOVX v353 weak boot headline survived')
    if '<span>IDEIAS</span><span>NÃO FICAM</span><span>PARADAS</span>' not in text:
        raise SystemExit('MOVX v353 boot headline was not installed')
    if 'v353-motion.js?v=v353-cinematic-motion' not in text:
        raise SystemExit('MOVX v353 motion runtime was not installed')

print(json.dumps({
  'release':release,
  'pages':installed,
  'copy':'stronger MOVX editorial voice',
  'motion':'boot sequence + scene reveals + pointer/scroll parallax',
  'crt_asset':'unchanged v352 standalone GLB',
  'css_bytes':len(css.encode()),
  'js_bytes':js_out.stat().st_size,
  'later_3d_models':'still deferred'
},ensure_ascii=False))
