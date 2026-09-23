"""MOVX v119 delivery optimization: collapse local stylesheets in built top-level pages.

The source tree remains untouched. Each generated HTML keeps the exact original CSS
cascade order, but the browser only needs one local stylesheet request per page.
"""
from pathlib import Path
import hashlib
import json
import re

root = Path(__file__).resolve().parents[1]
out = root / '_site'
release = 'v119-css-bundle'

stylesheet_re = re.compile(
    r'<link\b(?=[^>]*\brel=["\']stylesheet["\'])[^>]*\bhref=["\']([^"\']+)["\'][^>]*>\s*',
    re.I,
)
charset_re = re.compile(r'^\ufeff?\s*@charset\s+["\'][^"\']+["\'];\s*', re.I)


def local_css(href):
    ref = href.split('?', 1)[0].split('#', 1)[0]
    if not ref or ':' in ref or ref.startswith('//') or not ref.lower().endswith('.css'):
        return None
    path = out / ref
    return (ref, path) if path.is_file() else None


def bundle_page(html):
    content = html.read_text()
    matches = list(stylesheet_re.finditer(content))
    local = []
    for match in matches:
        resolved = local_css(match.group(1))
        if resolved:
            local.append((match, *resolved))

    # Preserve mixed external/local ordering rather than making a risky rewrite.
    if len(local) < 2 or len(local) != len(matches):
        return None

    digest = hashlib.sha1()
    bundle_parts = []
    for _match, ref, path in local:
        raw = path.read_bytes()
        digest.update(ref.encode('utf-8'))
        digest.update(b'\0')
        digest.update(raw)
        css = charset_re.sub('', raw.decode('utf-8'))
        bundle_parts.append(f'/* MOVX bundle source: {ref} */\n{css.strip()}\n')

    bundle_name = f'movx-css-{digest.hexdigest()[:12]}.css'
    bundle_path = out / bundle_name
    bundle_path.write_text('\n'.join(bundle_parts))

    pieces = []
    cursor = 0
    inserted = False
    local_starts = {match.start() for match, _ref, _path in local}
    for match in matches:
        pieces.append(content[cursor:match.start()])
        if match.start() in local_starts:
            if not inserted:
                pieces.append(f'<link rel="stylesheet" href="{bundle_name}?v={release}">\n')
                inserted = True
        else:
            pieces.append(match.group(0))
        cursor = match.end()
    pieces.append(content[cursor:])
    html.write_text(''.join(pieces))

    return {
        'page': html.name,
        'requests_before': len(local),
        'requests_after': 1,
        'bundle': bundle_name,
        'bundle_bytes': bundle_path.stat().st_size,
    }


stats = []
for html in sorted(out.glob('*.html')):
    result = bundle_page(html)
    if result:
        stats.append(result)

if not stats:
    raise SystemExit('MOVX v119 did not find any top-level page eligible for CSS bundling')

required = {'index.html', 'latest.html', 'social-media.html'}
processed = {item['page'] for item in stats}
missing = sorted(required - processed)
if missing:
    raise SystemExit(f'MOVX v119 failed to bundle canonical pages: {missing}')

print(json.dumps({'release': release, 'pages': stats}, ensure_ascii=False))
