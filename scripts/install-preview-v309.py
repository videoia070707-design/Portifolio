from pathlib import Path
import shutil

root = Path(__file__).resolve().parents[1]
out = root / '_site'
previews = ('movx-v308-preview', 'movx-v309-preview', 'movx-v310-preview', 'movx-v311-preview')
for name in previews:
    src = root / name
    dst = out / name
    if not src.exists():
        raise SystemExit(f'missing preview source: {src}')
    if dst.exists():
        shutil.rmtree(dst)
    shutil.copytree(src, dst)
print('installed preview folders:', ', '.join(previews))