from pathlib import Path
import sys

if len(sys.argv) != 2:
    raise SystemExit('usage: v51-runtime-audit.py <site-dir>')

site = Path(sys.argv[1])
script = site / 'script.js'
text = script.read_text(encoding='utf-8')

calls = "    refreshProjects();\n    refreshNiches();\n    refreshCaseFrames();"
if calls in text and "let raf = 0;\n\n    refreshProjects();" not in text:
    text = text.replace(calls, "    let raf = 0;\n\n" + calls, 1)

late = "    let raf = 0;\n    let lastScrollY = scrollY;"
if late in text:
    text = text.replace(late, "    let lastScrollY = scrollY;", 1)

script.write_text(text, encoding='utf-8')
print('MOVX v51 runtime audit applied: v39 RAF scheduler initialized before observer/refresh callbacks')
