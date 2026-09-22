from pathlib import Path
import json, re, sys

root = Path(sys.argv[1] if len(sys.argv) > 1 else '.')

# 1) Conveyor: 3 different curated rows, not the same sequence shifted.
script_path = root / 'script.js'
script = script_path.read_text(encoding='utf-8')
old = """    const offsets = [0,3,7];
    stopConveyorLoop();
    loopWall.innerHTML = offsets.map((offset,rowIndex)=>{
      const row = [...items.slice(offset),...items.slice(0,offset)];
      const doubled = [...row,...row];
"""
new = """    const rowIndexes = [
      [0,3,6,9,12,2],
      [1,4,7,10,0,5],
      [2,5,8,11,6,1]
    ];
    stopConveyorLoop();
    loopWall.innerHTML = rowIndexes.map((indexes,rowIndex)=>{
      const row = indexes.map(index => items[index % items.length]).filter(Boolean);
      const doubled = [...row,...row];
"""
if old not in script:
    raise SystemExit('renderLoopWall source not found')
script = script.replace(old, new, 1)
loop_img = '<img src="${project.cover}" alt="${project.client} — ${meta.title}" loading="lazy">'
if loop_img not in script:
    raise SystemExit('loop image template not found')
script = script.replace(loop_img, '<img src="${project.cover}" alt="${project.client} — ${meta.title}" loading="${itemIndex < 2 ? \'eager\' : \'lazy\'}" fetchpriority="${itemIndex === 0 ? \'high\' : \'auto\'}" decoding="async">', 1)
script = script.replace('<div class="case-hero__media"><img src="${project.cover}" alt="${project.client} — ${meta.title}"></div>', '<div class="case-hero__media"><img src="${project.cover}" alt="${project.client} — ${meta.title}" loading="eager" fetchpriority="high" decoding="async"></div>')
script = script.replace('<div class="case-slide-frame"><img src="${src}" alt="${project.client} — ${meta.title}, slide ${index+1}" loading="eager"></div>', '<div class="case-slide-frame"><img src="${src}" alt="${project.client} — ${meta.title}, slide ${index+1}" loading="${index < 2 ? \'eager\' : \'lazy\'}" fetchpriority="${index === 0 ? \'high\' : \'auto\'}" decoding="async"></div>')
script = script.replace(' loading="lazy">', ' loading="lazy" decoding="async">')
script_path.write_text(script, encoding='utf-8')

# 2) Refined copy and replace visible AI positioning with technology/innovation.
copy = {
'pt': {
'nav.ai':'Tecnologia & Inovação','home.kicker':'SOCIAL MEDIA / EDIÇÃO DE VÍDEO / TECNOLOGIA & INOVAÇÃO',
'home.intro':'A MOVX reúne direção de arte, social, motion e tecnologia de ponta para transformar briefings em linguagens visuais coerentes — cada projeto nasce como sistema, não como peça isolada.',
'home.disciplinesText':'Social, vídeo e tecnologia aplicada à criação.','discipline.aiMeta':'3D / prototipagem / visuais de produto / I&D','footer.disciplines':'Social Media / Edição de Vídeo / Tecnologia & Inovação',
'ai.index':'03 / TECNOLOGIA & INOVAÇÃO','ai.title':'<span class="mask-reveal"><span>Novas ferramentas</span></span><span class="mask-reveal"><span>Mesma direção</span></span>',
'ai.intro':'Tecnologia de ponta entra como extensão da direção criativa: 3D, prototipagem, automação, experimentação visual e workflows emergentes com intenção clara.','ai.meta3':'tecnologia como processo, não como efeito',
'ai.emptyTitle':'I&amp;D<br>em construção','ai.emptyText':'Este capítulo será dedicado a casos em que tecnologia amplia a linguagem visual: 3D, produto, protótipos, sistemas generativos, automação e novas formas de produção integradas ao design.','ai.emptyMarker':'A preparar casos de tecnologia aplicada','ai.footerBig':'Expandir o <em>possível</em>','ai.footerMeta':'Arquivo reservado a tecnologia aplicada e I&D',
'home.velocity':'DIREÇÃO DE ARTE — DESIGN SOCIAL — CARROSSÉIS — SISTEMAS DE MARCA — EDIÇÃO DE VÍDEO — MOTION — TECNOLOGIA & INOVAÇÃO —',
'home.aboutKicker':'SOBRE / COMO EU PENSO','home.aboutTitle':'Construo linguagem<br>antes de construir peças',
'home.aboutLead':'Trabalho na interseção entre direção de arte, social, vídeo e tecnologia de ponta. Em vez de acumular peças isoladas, construo sistemas visuais capazes de manter identidade, variar com intenção e crescer junto com a marca.',
'home.aboutBody':'Começo entendendo contexto, posicionamento e o que precisa ser percebido. A partir daí, referências viram critérios; tipografia, imagem, cor, composição e movimento passam a cumprir funções claras. O resultado é uma linguagem que parece própria — não um conjunto de tendências.',
'home.servicesKicker':'SERVIÇOS / DO CONCEITO À ENTREGA','home.servicesTitle':'Estratégia visual<br>que vira sistema',
'home.service1Text':'Posicionamento visual, conceito, referências, direção fotográfica, tipografia, paleta e regras de linguagem para dar uma assinatura reconhecível à marca.',
'home.service2Text':'Carrosséis, campanhas e ecossistemas de conteúdo pensados em série: cada peça cumpre uma função, sem repetir o mesmo template.',
'home.service3Text':'Edição, ritmo, motion, transições e sound design alinhados à identidade visual e ao objetivo de retenção.',
'home.service4':'Tecnologia & inovação visual','home.service4Text':'3D, prototipagem, automação criativa e ferramentas emergentes integradas ao processo para ampliar possibilidades sem sacrificar direção.','contact.option.ai':'Tecnologia & inovação'
},
'en': {
'nav.ai':'Technology & Innovation','home.kicker':'SOCIAL MEDIA / VIDEO EDITING / TECHNOLOGY & INNOVATION',
'home.intro':'MOVX brings together art direction, social, motion and advanced technology to turn briefs into coherent visual languages — every project is built as a system, not an isolated piece.',
'home.disciplinesText':'Social, video and technology applied to creativity.','discipline.aiMeta':'3D / prototyping / product visuals / R&D','footer.disciplines':'Social Media / Video Editing / Technology & Innovation',
'ai.index':'03 / TECHNOLOGY & INNOVATION','ai.title':'<span class="mask-reveal"><span>New tools</span></span><span class="mask-reveal"><span>Same direction</span></span>',
'ai.intro':'Advanced technology works as an extension of creative direction: 3D, prototyping, automation, visual experimentation and emerging workflows used with clear intent.','ai.meta3':'technology as process, not effect',
'ai.emptyTitle':'R&amp;D<br>in progress','ai.emptyText':'This chapter will focus on cases where technology expands visual language: 3D, product, prototypes, generative systems, automation and new production methods integrated with design.','ai.emptyMarker':'Preparing applied-technology cases','ai.footerBig':'Expand the <em>possible</em>','ai.footerMeta':'Archive reserved for applied technology and R&D',
'home.velocity':'ART DIRECTION — SOCIAL DESIGN — CAROUSELS — BRAND SYSTEMS — VIDEO EDITING — MOTION — TECHNOLOGY & INNOVATION —',
'home.aboutKicker':'ABOUT / HOW I THINK','home.aboutTitle':'Build the language<br>before the pieces',
'home.aboutLead':'I work where art direction, social, video and advanced technology meet. Instead of accumulating isolated pieces, I build visual systems that preserve identity, vary with intent and grow with the brand.',
'home.aboutBody':'I start by understanding context, positioning and what needs to be perceived. References become criteria; typography, image, colour, composition and motion each get a clear role. The result should feel proprietary — not like a collection of trends.',
'home.servicesKicker':'SERVICES / FROM CONCEPT TO DELIVERY','home.servicesTitle':'Visual strategy<br>turned into a system',
'home.service1Text':'Visual positioning, concept, references, photographic direction, typography, palette and language rules that give the brand a recognisable signature.',
'home.service2Text':'Carousels, campaigns and content ecosystems designed as a series: every piece has a role without repeating the same template.',
'home.service3Text':'Editing, rhythm, motion, transitions and sound design aligned with the visual identity and retention goals.',
'home.service4':'Technology & visual innovation','home.service4Text':'3D, prototyping, creative automation and emerging tools integrated into the process to expand possibilities without sacrificing direction.','contact.option.ai':'Technology & innovation'
},
'es': {
'nav.ai':'Tecnología & Innovación','home.kicker':'SOCIAL MEDIA / EDICIÓN DE VÍDEO / TECNOLOGÍA & INNOVACIÓN',
'home.intro':'MOVX reúne dirección de arte, social, motion y tecnología avanzada para convertir briefs en lenguajes visuales coherentes — cada proyecto nace como sistema, no como pieza aislada.',
'home.disciplinesText':'Social, vídeo y tecnología aplicada a la creación.','discipline.aiMeta':'3D / prototipado / visuales de producto / I+D','footer.disciplines':'Social Media / Edición de Vídeo / Tecnología & Innovación',
'ai.index':'03 / TECNOLOGÍA & INNOVACIÓN','ai.title':'<span class="mask-reveal"><span>Nuevas herramientas</span></span><span class="mask-reveal"><span>La misma dirección</span></span>',
'ai.intro':'La tecnología avanzada funciona como extensión de la dirección creativa: 3D, prototipado, automatización, experimentación visual y workflows emergentes usados con intención clara.','ai.meta3':'tecnología como proceso, no como efeito',
'ai.emptyTitle':'I+D<br>en construcción','ai.emptyText':'Este capítulo estará dedicado a casos donde la tecnología amplía el lenguaje visual: 3D, producto, prototipos, sistemas generativos, automatización y nuevas formas de producción integradas con diseño.','ai.emptyMarker':'Preparando casos de tecnología aplicada','ai.footerBig':'Expandir lo <em>posible</em>','ai.footerMeta':'Archivo reservado para tecnología aplicada e I+D',
'home.velocity':'DIRECCIÓN DE ARTE — DISEÑO SOCIAL — CARRUSELES — SISTEMAS DE MARCA — EDICIÓN DE VÍDEO — MOTION — TECNOLOGÍA & INNOVACIÓN —',
'home.aboutKicker':'SOBRE MÍ / CÓMO PIENSO','home.aboutTitle':'Construyo lenguaje<br>antes que piezas',
'home.aboutLead':'Trabajo en la intersección entre dirección de arte, social, vídeo y tecnología avanzada. En lugar de acumular piezas aisladas, construyo sistemas visuales capaces de conservar identidad, variar con intención y crecer con la marca.',
'home.aboutBody':'Empiezo entendiendo contexto, posicionamiento y lo que debe percibirse. Las referencias se convierten en criterios; tipografía, imagen, color, composición y movimiento pasan a cumplir funciones claras. El resultado debe sentirse propio — no como una colección de tendencias.',
'home.servicesKicker':'SERVICIOS / DEL CONCEPTO A LA ENTREGA','home.servicesTitle':'Estrategia visual<br>convertida en sistema',
'home.service1Text':'Posicionamiento visual, concepto, referencias, dirección fotográfica, tipografía, paleta y reglas de lenguaje para dar a la marca una firma reconocible.',
'home.service2Text':'Carruseles, campañas y ecosistemas de contenido pensados en serie: cada pieza cumple una función sin repetir la misma plantilla.',
'home.service3Text':'Edición, ritmo, motion, transiciones y sound design alineados con la identidad visual y los objetivos de retención.',
'home.service4':'Tecnología & innovación visual','home.service4Text':'3D, prototipado, automatización creativa y herramientas emergentes integradas al proceso para ampliar posibilidades sin sacrificar dirección.','contact.option.ai':'Tecnología & innovación'
}}

i18n_path = root / 'i18n.js'
lines = i18n_path.read_text(encoding='utf-8').splitlines()
lang = None; out = []
for line in lines:
    m = re.match(r'\s{4}"(pt|en|es)": \{', line)
    if m: lang = m.group(1)
    km = re.match(r'(\s*)"([^"]+)":\s*.*', line)
    if lang and km and km.group(2) in copy[lang]:
        comma = ',' if line.rstrip().endswith(',') else ''
        line = f'{km.group(1)}"{km.group(2)}": {json.dumps(copy[lang][km.group(2)], ensure_ascii=False)}{comma}'
    out.append(line)
    if lang and line.strip() == '}': lang = None
i18n_path.write_text('\n'.join(out)+'\n', encoding='utf-8')

# 3) Static fallback + critical hero preload.
static = {
'Criação com IA':'Tecnologia & Inovação','AI Creator':'Technology & Innovation','AI CREATOR':'TECHNOLOGY & INNOVATION','CRIAÇÃO COM IA':'TECNOLOGIA & INOVAÇÃO',
'AI-assisted visuals':'Tecnologia & inovação visual','IA integrada ao processo de direção, composição e produção — como ferramenta, não como estética genérica.':'3D, prototipagem, automação criativa e ferramentas emergentes integradas ao processo para ampliar possibilidades sem sacrificar direção.',
'Direção antes<br>da decoração':'Construo linguagem<br>antes de construir peças','Do sistema<br>à execução':'Estratégia visual<br>que vira sistema',
'As ferramentas mudam':'Novas ferramentas','A direção permanece':'Mesma direção','IA como processo, não como estética':'tecnologia como processo, não como efeito',
'MOVX — AI Creator portfolio':'MOVX — Technology & Innovation portfolio','MOVX — AI Creator':'MOVX — Technology & Innovation','MOVX / AI CREATOR':'MOVX / TECHNOLOGY & INNOVATION',
'A aguardar casos reais de criação com IA':'A preparar casos de tecnologia aplicada','Arquivo reservado a casos reais de IA':'Arquivo reservado a tecnologia aplicada e I&D'
}
for name in ['index.html','social-media.html','ai-creator.html','video-editor.html']:
    path = root / name
    if not path.exists(): continue
    html = path.read_text(encoding='utf-8')
    for a,b in static.items(): html = html.replace(a,b)
    if 'soul-of-design-hero-clean.png' in html and 'rel="preload" as="image" href="assets/hero/soul-of-design-hero-clean.png"' not in html:
        html = html.replace('</head>', '<link rel="preload" as="image" href="assets/hero/soul-of-design-hero-clean.png" fetchpriority="high"/>\n</head>', 1)
    html = html.replace('class="social-cover-art__image" src="assets/hero/soul-of-design-hero-clean.png"', 'class="social-cover-art__image" src="assets/hero/soul-of-design-hero-clean.png" loading="eager" fetchpriority="high" decoding="async"')
    path.write_text(html, encoding='utf-8')

# 4) Research-led art direction layers.
# v85 establishes the baseline, v86 owns project/case continuity, v88 owns chapter continuity.
for source_name, target_name in [
    ('patches/v85-reference-direction.css','v85-reference-direction.css'),
    ('patches/v86-signature-motion.css','v86-signature-motion.css'),
    ('patches/v88-chapter-signature.css','v88-chapter-signature.css'),
    ('patches/v88-chapter-signature.js','v88-chapter-signature.js')
]:
    source = Path(source_name)
    if not source.exists():
        raise SystemExit(f'Missing {source_name}')
    (root / target_name).write_text(source.read_text(encoding='utf-8'), encoding='utf-8')

# v85 and v88 are static chapter layers. v86 is appended at runtime by the v41/v86
# shared-element owner so project/case transition styles still win their local cascade.
for name in ['index.html','social-media.html','ai-creator.html','video-editor.html']:
    path = root / name
    if not path.exists():
        continue
    html = path.read_text(encoding='utf-8')
    for marker in [
        '<link rel="stylesheet" href="v85-reference-direction.css?v=85-reference-direction">',
        '<link rel="stylesheet" href="v88-chapter-signature.css?v=88-chapter-signature">'
    ]:
        if marker not in html:
            html = html.replace('</head>', marker + '\n</head>', 1)
    script_marker = '<script src="v88-chapter-signature.js?v=88-chapter-signature"></script>'
    if script_marker not in html:
        html = html.replace('</body>', script_marker + '\n</body>', 1)
    path.write_text(html, encoding='utf-8')

print('MOVX v88 build transform applied')