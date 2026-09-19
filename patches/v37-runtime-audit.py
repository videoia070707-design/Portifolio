from pathlib import Path
import sys

root = Path(sys.argv[1] if len(sys.argv) > 1 else '.')
script_path = root / 'script.js'
script = script_path.read_text(encoding='utf-8')

# Marker makes the build audit explicit and idempotent.
marker = '/* MOVX v37 build optimization — CSS-owned marquee motion + redundant legacy interaction hooks removed. */'
if marker not in script:
    script = marker + '\n' + script

# 1) The source ZIP still ships its original RAF conveyor. Current releases also
# had a second conveyor engine appended later, so the same wall could be written
# by two runtimes. v37 makes marquee motion CSS-owned and leaves this function as
# a compatibility no-op because renderLoopWall() still calls it.
start = script.find('  function initConveyorLoop(){')
end_token = '  const filterDefs = ['
end = script.find(end_token, start if start >= 0 else 0)
if start >= 0 and end > start:
    script = script[:start] + '  function initConveyorLoop(){ stopConveyorLoop(); }\n\n' + script[end:]
elif 'function initConveyorLoop(){ stopConveyorLoop(); }' not in script:
    raise SystemExit('v37 optimizer: legacy conveyor block not found')

# 2) The old velocity ticker is another infinite RAF loop. The v37 CSS layer
# owns this marquee with a compositor animation that can be paused offscreen.
for token in [
    '  let tickerX = 0;\n',
    '  let tickerVelocity = 0;\n',
    '    tickerVelocity += (y-lastY) * .065;\n',
]:
    script = script.replace(token, '')

# lastY became dead once velocity accumulation was removed.
script = script.replace('  let lastY = window.scrollY;\n', '')
script = script.replace('    lastY = y;\n', '')

ticker_start = script.find("  const ticker = document.querySelector('.velocity-track');")
ticker_end = script.find('  /* Reveal utilities */', ticker_start if ticker_start >= 0 else 0)
if ticker_start >= 0 and ticker_end > ticker_start:
    script = script[:ticker_start] + '  /* v37: ticker motion is compositor/CSS-owned; no permanent RAF loop. */\n\n' + script[ticker_end:]
elif 'ticker motion is compositor/CSS-owned' not in script:
    raise SystemExit('v37 optimizer: legacy ticker block not found')

# 3) v31 already provides restrained image-plane response. Keep only one pointer
# interaction system instead of stacking the old tilt / spotlight listeners.
for call in [
    '    attachTilt(loopWall);\n',
    '    attachTilt(archiveMount);\n',
    '    attachProjectSpotlight(listMount);\n',
    '  attachTilt();\n',
    '  attachProjectSpotlight();\n',
]:
    script = script.replace(call, '')

# 4) Fix the v31 preview observer feedback loop. The observer used to watch
# preview.style while its own callback wrote preview.style, causing churn.
script = script.replace("attributeFilter:['src','style','class']", "attributeFilter:['src','class']")

# 5) Reuse the theme-pop animation class that actually exists in CSS.
script = script.replace("'v30-theme-pop'", "'v28-theme-pop'")

script_path.write_text(script, encoding='utf-8')
print('MOVX v37 runtime audit applied: duplicate RAF engines removed, observer loop fixed, redundant tilt hooks disabled')
