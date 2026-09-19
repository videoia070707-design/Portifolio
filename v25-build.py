from pathlib import Path
import sys
root = Path(sys.argv[1]) if len(sys.argv)>1 else Path('.')

# Disable the legacy motion code in the base v18 bundle while preserving all data/UI behavior.
script = root/'script.js'
s = script.read_text(encoding='utf-8')
needle = "const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches || new URLSearchParams(location.search).has('static');"
if needle in s:
    s = s.replace(needle, "const reduceMotion = true; // MOVX v26: legacy animation engine disabled; premium runtime owns motion")
else:
    print('warning: legacy reduceMotion line not found')
script.write_text(s, encoding='utf-8')

# Load animation libraries from the deployed site itself. External CDN scripts were parser-blocking
# the application bundle for some visitors, leaving projects/text/images unrendered.
html = root/'social-media.html'
h = html.read_text(encoding='utf-8')
libs = '''<script src="vendor/gsap.min.js"></script>\n<script src="vendor/ScrollTrigger.min.js"></script>\n<script src="vendor/lenis.min.js"></script>'''
anchor = '<script src="projects.js"></script><script src="i18n.js"></script><script src="script.js"></script>'
if libs not in h:
    h = h.replace(anchor, f'<script src="projects.js"></script><script src="i18n.js"></script>{libs}<script src="script.js"></script>')
# Remove any stale remote dependency tags if this transform is ever run on an already-patched file.
for remote in [
    '<script src="https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/gsap.min.js"></script>\n',
    '<script src="https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/ScrollTrigger.min.js"></script>\n',
    '<script src="https://cdn.jsdelivr.net/npm/lenis@1.3.11/dist/lenis.min.js"></script>'
]:
    h = h.replace(remote, '')
html.write_text(h, encoding='utf-8')

print('MOVX v26 build isolation + local library injection applied')
