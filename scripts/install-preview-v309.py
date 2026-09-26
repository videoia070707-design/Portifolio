from pathlib import Path
import shutil

root = Path(__file__).resolve().parents[1]
out = root / '_site'
for name in ('movx-v308-preview', 'movx-v309-preview', 'movx-v310-preview'):
    src = root / name
    dst = out / name
    if not src.exists():
        raise SystemExit(f'missing preview source: {src}')
    if dst.exists():
        shutil.rmtree(dst)
    shutil.copytree(src, dst)
print('installed preview folders:', 'movx-v308-preview, movx-v309-preview, movx-v310-preview')
