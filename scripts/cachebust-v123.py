from pathlib import Path

root=Path(__file__).resolve().parents[1]
out=root/'_site'
old='v117-scroll-world.mjs?v=v122-real-scroll-scrub'
new='v117-scroll-world.mjs?v=v124-never-static-scroll-world'
pages=('index.html','latest.html','social-media.html')
rewritten=[]
for name in pages:
    path=out/name
    text=path.read_text()
    if old not in text and new not in text:
        raise SystemExit(f'MOVX v124 cache-bust target missing in {name}')
    changed=text.replace(old,new)
    path.write_text(changed)
    rewritten.append(name)
print({'release':'v124-never-static-scroll-world','runtime_cache_bust':new,'pages':rewritten})
