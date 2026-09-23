"""Static performance budgets for the deployed MOVX artifact."""
from pathlib import Path
import json
import re

root=Path(__file__).resolve().parents[1]
out=root/'_site'

budgets={
    'assets/hero/soul-of-design-hero-clean.webp':220_000,
    'media/movx-scroll-world-0923.mp4':3_600_000,
    'media/movx-scroll-world-0923-mobile.mp4':1_700_000,
    'media/movx-scroll-world-0923.webm':3_600_000,
    'media/movx-scroll-world-0923-mobile.webm':1_700_000,
    'media/movx-scroll-world-poster.jpg':180_000,
}
errors=[]
sizes={}
for name,limit in budgets.items():
    path=out/name
    size=path.stat().st_size if path.exists() else 0
    sizes[name]=size
    if not path.exists():errors.append(f'missing {name}')
    elif size>limit:errors.append(f'{name} is {size} bytes; budget is {limit}')

old='assets/hero/soul-of-design-hero-clean.png'
new='assets/hero/soul-of-design-hero-clean.webp'
stylesheet_re=re.compile(r'<link\b(?=[^>]*\brel=["\']stylesheet["\'])[^>]*\bhref=["\']([^"\']+)["\'][^>]*>',re.I)
css_bundles={}
for name in ('index.html','latest.html','social-media.html'):
    text=(out/name).read_text()
    if f'src="{old}"' in text or f'href="{old}"' in text:
        errors.append(f'{name} still loads the PNG hero')
    if f'src="{new}"' not in text or f'href="{new}"' not in text:
        errors.append(f'{name} is missing optimized hero preload/src')
    local_styles=[]
    for href in stylesheet_re.findall(text):
        ref=href.split('?',1)[0].split('#',1)[0]
        if ref and ':' not in ref and not ref.startswith('//'):
            local_styles.append(ref)
    if len(local_styles)!=1:
        errors.append(f'{name} loads {len(local_styles)} local stylesheets; expected one v119+ bundle')
    elif not local_styles[0].startswith('movx-css-'):
        errors.append(f'{name} does not load a MOVX CSS bundle: {local_styles[0]}')
    else:
        bundle=out/local_styles[0]
        if not bundle.exists():
            errors.append(f'{name} references missing CSS bundle {local_styles[0]}')
        else:
            css_bundles[local_styles[0]]=bundle.stat().st_size

runtime=(out/'script.js').read_text()
if 'loading="${itemIndex < 2 ? \'eager\' : \'lazy\'}"' in runtime:
    errors.append('conveyor still promotes below-fold artwork to eager')
if 'loading="lazy" fetchpriority="low"' not in runtime:
    errors.append('conveyor low-priority image policy is missing')
if "rootMargin:'320px 0px'" not in runtime:
    errors.append('archive predecode margin was not reduced')

scroll=(out/'v117-scroll-world.mjs').read_text()
if "rootMargin:'0px'" not in scroll:
    errors.append('Scroll World intersection margin is not zero')
if "video.src=urls.desktop" not in scroll:
    errors.append('Scroll World desktop direct optimized source is missing')
if "const data=await response.blob()" not in scroll or "video.src=blobURL" not in scroll:
    errors.append('Scroll World mobile deferred Blob path is missing')
if 'userEngaged' not in scroll or 'engagementThreshold' not in scroll:
    errors.append('Scroll World explicit user-scroll gate is missing')
if 'if(active){if(userEngaged)load();schedule()}' not in scroll:
    errors.append('Scroll World can still request media before user engagement')

fragment=(out/'index.html').read_text()
if fragment.count('data-world-chapter-panel=')!=4:
    errors.append('Scroll World must render four scroll chapters')

if errors:
    raise SystemExit('MOVX performance QA failed: '+json.dumps(errors,ensure_ascii=False))
print(json.dumps({'status':'passed','sizes':sizes,'css_bundles':css_bundles,'deferred_video_gate':True,'desktop_delivery':'optimized-direct','mobile_delivery':'optimized-blob','scroll_chapters':4},ensure_ascii=False))
