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

## Desktop e mobile
- Desktop e mobile usam o mesmo princípio: o scroll controla diretamente `video.currentTime`.
- No mobile o filme permanece sticky e recebe uma coreografia de profundidade própria: quadro mais aberto no começo para preservar as várias TVs, zoom mais forte na travessia e recuo progressivo ao revelar o arquivo.
- O mobile não recebe um player comum, autoplay ou controles.
- O vídeo é anexado somente quando a seção entra na zona de aproximação, reduzindo download antecipado sem remover o efeito.
- `prefers-reduced-motion` continua sendo o único fallback estático intencional; erro real de mídia cai para poster.

## Media lifecycle
- Desktop/mobile sem reduced-motion: MP4 H.264 normal, com keyframes curtos para seeking por scroll.
- `prefers-reduced-motion`: sem `src` no vídeo; usa somente poster estático.
- O build reconstrói o MP4 antes do deploy a partir dos chunks text-safe em `.assets/into-signal`.
- O browser recebe um MP4 normal; não reconstrói base64 em runtime.

## QA gate
`scripts/qa-v116.cjs` verifica:
- hero preservado e Living Archive presente;
- vídeo sem autoplay/controls;
- progressão temporal monotônica em quatro pontos no desktop;
- progressão temporal monotônica em quatro pontos no mobile;
- início CRT mantido por mais tempo em ambos;
- zoom/depth da travessia mobile;
- handoff final visível em desktop e mobile;
- ausência de overflow;
- `prefers-reduced-motion` em modo estático sem download do vídeo.

## Estado da branch
A branch `v116-into-signal` contém runtime, CSS, fragmento, build wrapper e gate de QA com scrub obrigatório em desktop e mobile. `main` continua em v115 até o pacote de mídia codificado estar completo e o gate v116 passar no GitHub Actions.
