from pathlib import Path
import sys

path = Path(sys.argv[1] if len(sys.argv) > 1 else "_site/projects.js")
text = path.read_text(encoding="utf-8")
old = "    slides: ['assets/projects/belive-01.webp','assets/projects/belive-02.webp','assets/projects/belive-03.webp','assets/projects/belive-04.webp','assets/projects/belive-05.webp'],"
new = "    slides: ['assets/projects/belive-cashflow.webp','assets/projects/belive-02.webp','assets/projects/belive-03.webp','assets/projects/belive-04.webp','assets/projects/belive-05.webp','assets/projects/belive-01.webp'],"
if old not in text:
    raise SystemExit('Belive Cashflow slide-order pattern not found')
path.write_text(text.replace(old, new, 1), encoding="utf-8")
print('Belive Cashflow order updated: Faturamento/Caixa first, Belive brand slide last')
