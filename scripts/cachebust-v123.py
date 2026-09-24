from pathlib import Path

root=Path(__file__).resolve().parents[1]
out=root/'_site'
pages=('index.html','latest.html','social-media.html')
new='v117-scroll-world.mjs?v=v125-true-3d-scroll'
legacy=(
    'v117-scroll-world.mjs?v=v122-real-scroll-scrub',
    'v117-scroll-world.mjs?v=v124-never-static-scroll-world',
)
rewritten=[]
for name in pages:
    path=out/name
    text=path.read_text()
    if new not in text:
        matched=False
        for old in legacy:
            if old in text:
                text=text.replace(old,new)
                matched=True
        if not matched:
            raise SystemExit(f'MOVX v125 cache-bust target missing in {name}')
    path.write_text(text)
    rewritten.append(name)
print({'release':'v125-true-3d-scroll','runtime_cache_bust':new,'pages':rewritten})
