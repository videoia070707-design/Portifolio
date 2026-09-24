"""Static performance budgets for the deployed MOVX artifact."""
from pathlib import Path
import json
import re

root=Path(__file__).resolve().parents[1]
out=root/'_site'

budgets={
    'assets/hero/soul-of-design-hero-clean.webp':220_000,
    'media/movx-scroll-world-0923.mp4':3_900_000,
    'media/movx-scroll-world-0923-mobile.mp4':1_850_000,
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
        if not bundle.exists():errors.append(f'{name} references missing CSS bundle {local_styles[0]}')
        else:css_bundles[local_styles[0]]=bundle.stat().st_size

runtime=(out/'script.js').read_text()
if 'loading="${itemIndex < 2 ? \'eager\' : \'lazy\'}"' in runtime:errors.append('conveyor still promotes below-fold artwork to eager')
if 'loading="lazy" fetchpriority="low"' not in runtime:errors.append('conveyor low-priority image policy is missing')
if "rootMargin:'320px 0px'" not in runtime:errors.append('archive predecode margin was not reduced')

scroll=(out/'v117-scroll-world.mjs').read_text()
if "rootMargin:'120% 0px'" not in scroll or "rootMargin:'0px'" not in scroll:errors.append('Scroll World warm-load plus viewport observers are missing')
if "const response=await fetch(candidate.url" not in scroll or "const data=await response.blob()" not in scroll or "video.src=blobURL" not in scroll:errors.append('Scroll World deferred Blob delivery for reliable seeking is missing')
if "canWebM" not in scroll or "canH264" not in scroll or "candidatesFor" not in scroll:errors.append('Scroll World codec negotiation/retry candidates are missing')
if "if(canH264)items.push({codec:'h264-mp4'" not in scroll:errors.append('Scroll World no longer prefers H.264 for desktop scrub responsiveness')
if "sourceTrim=0.00" not in scroll or "mappedTarget" not in scroll or "markFrameReady" not in scroll:errors.append('Scroll World must scrub the complete encoded source from 0.00s')
if "retrying alternate codec" not in scroll:errors.append('Scroll World alternate codec retry is missing')
if 'userEngaged' not in scroll or 'engagementThreshold' not in scroll or '!nearby' not in scroll:errors.append('Scroll World engagement-aware warm loading is missing')
if 'video.play()' in scroll:errors.append('Scroll World must not depend on autoplay to expose real frames')
if "dataset.spatialMode='camera-3d'" not in scroll or '--world-persp-x' not in scroll or '--world-persp-y' not in scroll:errors.append('Scroll World spatial scroll contract is missing')

scroll_css=(out/'v117-scroll-world.css').read_text()
if 'background:#000' not in scroll_css:errors.append('Scroll World pure black stage is missing')
if '#050403' in scroll_css or '#080706' in scroll_css:errors.append('Scroll World still contains the old warm brown-black stage colors')
if 'rgba(5,4,4' in scroll_css:errors.append('Scroll World veil still contains warm brown tint')

fragment=(out/'index.html').read_text()
if fragment.count('data-world-chapter-panel=')!=4:errors.append('Scroll World must render four scroll chapters')
if 'movx-scroll-world-poster.jpg?v=v127-full-video-black' not in fragment:errors.append('Scroll World v127 dark-opening poster cache-bust is missing')
if 'ROLE PARA ATRAVESSAR' not in fragment:errors.append('Scroll World immersive interaction cue is missing')

if errors:
    raise SystemExit('MOVX performance QA failed: '+json.dumps(errors,ensure_ascii=False))
print(json.dumps({'status':'passed','sizes':sizes,'css_bundles':css_bundles,'deferred_video_gate':True,'desktop_delivery':'full-video h264-first blob scrub','mobile_delivery':'full-video h264-first blob scrub','source_trim_seconds':0.00,'stage_background':'#000','warm_margin':'120%','scroll_chapters':4},ensure_ascii=False))