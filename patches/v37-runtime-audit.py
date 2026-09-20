from pathlib import Path
import re
import sys

root = Path(sys.argv[1] if len(sys.argv) > 1 else '.')
script_path = root / 'script.js'
script = script_path.read_text(encoding='utf-8')

# Marker makes the build audit explicit and idempotent.
marker = '/* MOVX v37 build optimization — CSS-owned marquee motion + redundant legacy interaction hooks removed. */'
if marker not in script:
    script = marker + '\n' + script

# 1) The source ZIP still ships its original RAF conveyor. Current releases also
# had a second conveyor engine appended later, so the same wall could be written
# by two runtimes. v37 makes marquee motion CSS-owned and leaves this function as
# a compatibility no-op because renderLoopWall() still calls it.
start = script.find('  function initConveyorLoop(){')
end_token = '  const filterDefs = ['
end = script.find(end_token, start if start >= 0 else 0)
if start >= 0 and end > start:
    script = script[:start] + '  function initConveyorLoop(){ stopConveyorLoop(); }\n\n' + script[end:]
elif 'function initConveyorLoop(){ stopConveyorLoop(); }' not in script:
    raise SystemExit('v37 optimizer: legacy conveyor block not found')

# 2) The old velocity ticker is another infinite RAF loop. The v37 CSS layer
# owns this marquee with a compositor animation that can be paused offscreen.
for token in [
    '  let tickerX = 0;\n',
    '  let tickerVelocity = 0;\n',
    '    tickerVelocity += (y-lastY) * .065;\n',
]:
    script = script.replace(token, '')

# lastY became dead once velocity accumulation was removed.
script = script.replace('  let lastY = window.scrollY;\n', '')
script = script.replace('    lastY = y;\n', '')

ticker_start = script.find("  const ticker = document.querySelector('.velocity-track');")
ticker_end = script.find('  /* Reveal utilities */', ticker_start if ticker_start >= 0 else 0)
if ticker_start >= 0 and ticker_end > ticker_start:
    script = script[:ticker_start] + '  /* v37: ticker motion is compositor/CSS-owned; no permanent RAF loop. */\n\n' + script[ticker_end:]
elif 'ticker motion is compositor/CSS-owned' not in script:
    raise SystemExit('v37 optimizer: legacy ticker block not found')

# 3) v31 already provides restrained image-plane response. Keep only one pointer
# interaction system instead of stacking the old tilt / spotlight listeners.
for call in [
    '    attachTilt(loopWall);\n',
    '    attachTilt(archiveMount);\n',
    '    attachProjectSpotlight(listMount);\n',
    '  attachTilt();\n',
    '  attachProjectSpotlight();\n',
]:
    script = script.replace(call, '')

# 4) Fix the v31 preview observer feedback loop. The observer used to watch
# preview.style while its own callback wrote preview.style, causing churn.
script = script.replace("attributeFilter:['src','style','class']", "attributeFilter:['src','class']")

# 5) Reuse the theme-pop animation class that actually exists in CSS.
script = script.replace("'v30-theme-pop'", "'v28-theme-pop'")

script_path.write_text(script, encoding='utf-8')

# 6) v71 — share/search metadata. The portfolio is now a multi-discipline site,
# so each public chapter gets a stable title, canonical URL and social preview.
base_url = 'https://videoia070707-design.github.io/Portifolio/'
preview = base_url + 'assets/hero/soul-of-design-hero-clean.png'
favicon = "data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20viewBox='0%200%2064%2064'%3E%3Crect%20width='64'%20height='64'%20rx='12'%20fill='%23090807'/%3E%3Cpath%20d='M12%2044V20h8l12%2014%2012-14h8v24h-8V31L32%2045%2020%2031v13z'%20fill='%23f3eee9'/%3E%3C/svg%3E"
pages = {
    'social-media.html': {
        'title': 'MOVX — Social Media | Creative Portfolio',
        'description': 'Direção de arte, social media, carrosséis, campanhas e sistemas visuais no portfólio MOVX.',
        'canonical': base_url,
    },
    'video-editor.html': {
        'title': 'MOVX — Video Editor | Creative Portfolio',
        'description': 'Edição, ritmo, motion, transições e sound design como parte do portfólio criativo MOVX.',
        'canonical': base_url + 'video-editor.html',
    },
    'ai-creator.html': {
        'title': 'MOVX — AI Creator | Creative Portfolio',
        'description': 'Criação visual assistida por IA, prototipagem e tecnologia criativa integradas à direção do portfólio MOVX.',
        'canonical': base_url + 'ai-creator.html',
    },
}

def replace_or_add_meta(doc, key, value, prop=False):
    attr = 'property' if prop else 'name'
    pattern = rf'<meta\s+[^>]*{attr}=["\']{re.escape(key)}["\'][^>]*>'
    tag = f'<meta {attr}="{key}" content="{value}">'
    if re.search(pattern, doc, flags=re.I):
        return re.sub(pattern, tag, doc, count=1, flags=re.I)
    return doc.replace('</head>', tag + '\n</head>')

for filename, meta in pages.items():
    path = root / filename
    if not path.exists():
        continue
    doc = path.read_text(encoding='utf-8')
    doc = re.sub(r'<title>.*?</title>', f'<title>{meta["title"]}</title>', doc, count=1, flags=re.I | re.S)
    doc = replace_or_add_meta(doc, 'description', meta['description'])
    doc = replace_or_add_meta(doc, 'robots', 'index,follow,max-image-preview:large')
    doc = replace_or_add_meta(doc, 'theme-color', '#090807')
    doc = replace_or_add_meta(doc, 'og:type', 'website', prop=True)
    doc = replace_or_add_meta(doc, 'og:site_name', 'MOVX Creative Portfolio', prop=True)
    doc = replace_or_add_meta(doc, 'og:locale', 'pt_PT', prop=True)
    doc = replace_or_add_meta(doc, 'og:title', meta['title'], prop=True)
    doc = replace_or_add_meta(doc, 'og:description', meta['description'], prop=True)
    doc = replace_or_add_meta(doc, 'og:url', meta['canonical'], prop=True)
    doc = replace_or_add_meta(doc, 'og:image', preview, prop=True)
    doc = replace_or_add_meta(doc, 'twitter:card', 'summary_large_image')
    doc = replace_or_add_meta(doc, 'twitter:title', meta['title'])
    doc = replace_or_add_meta(doc, 'twitter:description', meta['description'])
    doc = replace_or_add_meta(doc, 'twitter:image', preview)
    doc = re.sub(r'<link\s+rel=["\']canonical["\'][^>]*>\s*', '', doc, flags=re.I)
    doc = re.sub(r'<link\s+rel=["\']icon["\'][^>]*>\s*', '', doc, flags=re.I)
    head_extras = f'<link rel="canonical" href="{meta["canonical"]}">\n<link rel="icon" href="{favicon}">\n'
    doc = doc.replace('</head>', head_extras + '</head>')
    path.write_text(doc, encoding='utf-8')

# 7) v72 — append the final footer layer to the generated stylesheet. Keeping this
# in the build audit means the source ZIP can remain untouched while the release
# still receives the current authored closing system.
footer_patch = Path('patches/v72-footer.css')
styles_path = root / 'styles.css'
if footer_patch.exists() and styles_path.exists():
    footer_css = footer_patch.read_text(encoding='utf-8')
    styles = styles_path.read_text(encoding='utf-8')
    if 'MOVX v72 — editorial closing system' not in styles:
        styles = styles.rstrip() + '\n\n' + footer_css.strip() + '\n'
        styles_path.write_text(styles, encoding='utf-8')

print('MOVX build audit applied: runtime optimized; v71 metadata + v72 editorial footer injected')