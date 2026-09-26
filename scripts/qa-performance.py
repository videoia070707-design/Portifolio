"""Static performance budgets for the deployed MOVX artifact.

v321 promotes the spatial storyboard to / while preserving the legacy editorial
portfolio at social-media.html. Budgets therefore validate both surfaces instead
of assuming that index.html and social-media.html are the same document.
"""
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
    'media/movx-scroll-world-0923-mobile.webm':1_750_000,
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

stylesheet_re=re.compile(r'<link\b(?=[^>]*\brel=["\']stylesheet["\'])[^>]*\bhref=["\']([^"\']+)["\'][^>]*>',re.I)
script_re=re.compile(r'<script\b[^>]*\bsrc=["\']([^"\']+)["\'][^>]*></script>',re.I)

# Legacy editorial surface remains optimized/bundled and keeps the v138 hero.
old='assets/hero/soul-of-design-hero-clean.png'
new='assets/hero/soul-of-design-hero-clean.webp'
legacy=out/'social-media.html'
if not legacy.exists():
    errors.append('missing social-media.html')
    legacy_text=''
else:
    legacy_text=legacy.read_text()
    if f'src="{old}"' in legacy_text or f'href="{old}"' in legacy_text:
        errors.append('social-media.html still loads the PNG hero')
    if f'src="{new}"' not in legacy_text and f'href="{new}"' not in legacy_text:
        errors.append('social-media.html is missing optimized hero preload/src')
    legacy_styles=[]
    for href in stylesheet_re.findall(legacy_text):
        ref=href.split('?',1)[0].split('#',1)[0]
        if ref and ':' not in ref and not ref.startswith('//'):
            legacy_styles.append(ref)
    if len(legacy_styles)!=1:
        errors.append(f'social-media.html loads {len(legacy_styles)} local stylesheets; expected one v119+ bundle')
    elif not legacy_styles[0].startswith('movx-css-'):
        errors.append(f'social-media.html does not load a MOVX CSS bundle: {legacy_styles[0]}')
    elif not (out/legacy_styles[0]).exists():
        errors.append(f'social-media.html references missing CSS bundle {legacy_styles[0]}')

# Production storyboard: many small versioned layers are intentional. Keep a
# combined static budget and verify every local reference exists.
home=out/'index.html'
home_css_bytes=0
home_js_bytes=0
home_styles=[]
home_scripts=[]
if not home.exists():
    errors.append('missing index.html')
    home_text=''
else:
    home_text=home.read_text()
    if 'data-movx-production="v321-production-storyboard"' not in home_text:
        errors.append('index.html is not the v321 production storyboard')
    if 'data-storyboard="v320"' not in home_text:
        errors.append('index.html missing v320 storyboard marker')
    if '../assets/' in home_text:
        errors.append('index.html contains parent-relative asset paths')
    for href in stylesheet_re.findall(home_text):
        ref=href.split('?',1)[0].split('#',1)[0]
        if not ref or ':' in ref or ref.startswith('//'):continue
        home_styles.append(ref)
        path=out/ref
        if not path.exists():errors.append(f'index.html references missing CSS {ref}')
        else:home_css_bytes+=path.stat().st_size
    for src in script_re.findall(home_text):
        ref=src.split('?',1)[0].split('#',1)[0]
        if not ref or ':' in ref or ref.startswith('//'):continue
        home_scripts.append(ref)
        path=out/ref
        if not path.exists():errors.append(f'index.html references missing JS {ref}')
        else:home_js_bytes+=path.stat().st_size
    if len(home_styles)!=12:errors.append(f'index.html loads {len(home_styles)} storyboard CSS layers; expected 12')
    if len(home_scripts)!=10:errors.append(f'index.html loads {len(home_scripts)} storyboard JS layers; expected 10')
    if home_css_bytes>600_000:errors.append(f'v321 storyboard CSS is {home_css_bytes} bytes; budget is 600000')
    if home_js_bytes>450_000:errors.append(f'v321 storyboard JS is {home_js_bytes} bytes; budget is 450000')
    for slot in ('boot-tv','hero-movx-logo','x-portal','creative-machine','play-cassette','play-camera','play-cube','play-cd','play-window','spatial-studio','closing-window'):
        if f'data-model-slot="{slot}"' not in home_text:errors.append(f'index.html missing model slot {slot}')

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

# The Scroll World contract now belongs to the preserved editorial route.
if legacy_text:
    if legacy_text.count('data-world-chapter-panel=')!=4:errors.append('social-media Scroll World must render four scroll chapters')
    if 'movx-scroll-world-poster.jpg?v=v127-full-video-black' not in legacy_text:errors.append('social-media Scroll World v127 poster cache-bust is missing')
    if 'ROLE PARA ATRAVESSAR' not in legacy_text:errors.append('social-media Scroll World interaction cue is missing')

if errors:
    raise SystemExit('MOVX performance QA failed: '+json.dumps(errors,ensure_ascii=False))
print(json.dumps({
    'status':'passed','sizes':sizes,
    'storyboard':{'css_layers':len(home_styles),'css_bytes':home_css_bytes,'js_layers':len(home_scripts),'js_bytes':home_js_bytes},
    'legacy_editorial':'social-media.html',
    'deferred_video_gate':True,'desktop_delivery':'full-video h264-first blob scrub','mobile_delivery':'full-video h264-first blob scrub',
    'source_trim_seconds':0.00,'stage_background':'#000','warm_margin':'120%','scroll_chapters':4
},ensure_ascii=False))
