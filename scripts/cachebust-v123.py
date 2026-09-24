from pathlib import Path
import re

root=Path(__file__).resolve().parents[1]
out=root/'_site'
pages=('index.html','latest.html','social-media.html')
release='v130-title-legibility'
targets=('v117-scroll-world.mjs','v129-scroll-story.mjs')
rewritten=[]

for name in pages:
    path=out/name
    text=path.read_text()
    for target in targets:
        pattern=rf'{re.escape(target)}\?v=[^"\']+'
        replacement=f'{target}?v={release}'
        text,count=re.subn(pattern,replacement,text)
        if count!=1:
            raise SystemExit(f'MOVX {release} cache-bust target {target} missing/duplicated in {name}: {count}')
    path.write_text(text)
    rewritten.append(name)

print({'release':release,'runtime_cache_bust':list(targets),'pages':rewritten})
