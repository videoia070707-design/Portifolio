# MOVX v116 — Into the Signal Scroll Film

## Objetivo
Inserir o filme `Into the Signal` entre a capa `Soul of Design` e o `Living Archive`, sem substituir o hero e sem criar um segundo motor global de scroll.

## Ownership
- v116 é dono apenas da superfície do filme e de `video.currentTime`.
- Não cria Lenis, ScrollTrigger global, timeline GSAP ou loop RAF concorrente.
- O runtime agenda no máximo um `requestAnimationFrame` por evento de scroll/resize.
- A capa existente e o Living Archive continuam DOM reais e independentes.

## Curva aprovada
O progresso normalizado da seção é remapeado para preservar o começo com várias TVs:
- 0–38% do scroll → 0–28% do filme: `Signal`, abertura/CRTs mais longa.
- 38–58% → 28–56%: `Crossing`, aproximação e travessia.
- 58–90% → 56–94%: `Archive`, maior janela para o universo MOVX.
- 90–100% → 94–99.5%: desaceleração + handoff ao arquivo real.

## Media lifecycle
- Desktop sem reduced-motion: o MP4 é anexado somente quando o modo `scrub` é ativo.
- Mobile e `prefers-reduced-motion`: sem `src` no vídeo; usa somente poster estático.
- O build reconstrói o MP4 antes do deploy a partir dos chunks text-safe em `.assets/into-signal`.
- O browser recebe um MP4 normal; não reconstrói base64 em runtime.

## QA gate
`scripts/qa-v116.cjs` verifica:
- hero preservado e Living Archive presente;
- vídeo sem autoplay/controls;
- progressão temporal monotônica em quatro pontos;
- início CRT mantido por mais tempo;
- handoff final visível;
- ausência de overflow;
- mobile/reduced-motion em modo estático sem download do vídeo.

## Estado da branch
A branch `v116-into-signal` contém runtime, CSS, fragmento, build wrapper e gate de QA. `main` continua em v115 até o pacote de mídia codificado estar completo e o gate v116 passar no GitHub Actions.
