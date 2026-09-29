# MOVX v362 — CRT tátil, sem adicionar outro 3D

## Continuidade

A base desta revisão é a v361-live-channels. A TV aprovada continua sendo o único GLB de produção e os quatro canais continuam sendo conteúdo real dentro da própria tela.

## O que muda

- A tela física passa a responder localmente ao cursor: brilho do vidro, microparallax do conteúdo e scanlines discretas acompanham o ponto real atingido pelo raycaster.
- O feedback acontece na tela e no seletor, não por grandes rotações da TV inteira.
- O seletor recebe uma pequena resposta mecânica quando um canal é sintonizado.
- A transição de canal ganha um pulso curto de fósforo/varredura, sem flicker aleatório nem strobe.
- Digital mostra um pequeno ponteiro dentro da própria interface apenas durante interação precisa; os outros canais preservam suas linguagens.
- Touch mantém scroll natural. Reduced motion desliga deslocamento/parallax e mantém todas as ações manuais.

## Arquitetura e performance

- Nenhum novo modelo 3D.
- Nenhum novo contexto WebGL.
- Nenhum canvas visível adicional.
- O módulo v362 usa dois canvases offscreen pequenos apenas como buffers 2D da textura já existente.
- A composição tátil é limitada a 30 fps e só roda enquanto há frame novo, hover ou pulso em andamento.
- A textura base v361 continua limitada pelo próprio contrato de 24 fps.

## QA

`qa-v362-crt-tactility.cjs` verifica desktop, mobile e reduced-motion, incluindo resposta do vidro, textura reativa, feedback do seletor, manutenção dos 44.831 triângulos, um único canvas WebGL e ausência de overflow.

O smoke test publicado também foi corrigido para o contrato atual CRT-only. O gate antigo ainda tentava carregar Hero Logo, X Portal, Creative Machine e outros modelos que foram deliberadamente desativados; isso gerava timeout mesmo com o site correto.
