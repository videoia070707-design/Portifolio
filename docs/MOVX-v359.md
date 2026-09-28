# MOVX v359 — TV CRT: interação e carregamento

Base: `193bebab79e63d42ed2a38b3ed136fb514d2a582` (v358 mais recente).

- Preserva a TV standalone aprovada e todos os seus 17 meshes / 44.831 triângulos. Os outros slots continuam deferred.
- Canais Direção, Motion, AI e Digital usam botões nativos, seleção por teclado, descrição e link à respectiva área.
- Perspectiva real da malha, poses dos canais e resposta ao cursor mais perceptíveis; suavização proporcional ao tempo.
- Elimina a disputa entre v314/v354/v358 sobre os valores de cursor e scroll. O canvas não recebe a falsa inclinação em CSS.
- Texturas limitadas a 2048 px antes de WebP/quantização: GLB de 1.939.208 para 1.695.720 bytes. Malha e fonte original preservadas.
- Poster de 38.186 bytes da TV aprovada aparece antes do WebGL; mantém o proxy da mesma TV e a troca para o GLB no mesmo canvas.
- Sombra de contato suave substitui a sombra retangular e seu passe de renderização.
- Abertura mobile em fluxo natural; controles e descrição ficam dentro da seção, sem recorte por sticky.
- Retorno por bfcache preserva o renderer; movimento reduzido mantém a navegação pelos canais.

Verificação local: Chromium/SwiftShader, desktop, mobile 390 px, mobile 320 px, teclado, movimento reduzido, fallback sem WebGL e invariant de apenas um modelo ativo. O teste `scripts/qa-v359-channel-flow.cjs` cobre os controles e o fallback. Os testes anteriores de runtime, enquadramento, headline e interação continuam no workflow.

Limites: medições locais em Chromium não representam uma garantia de tempo em toda conexão/GPU. O material de 4K original permanece intacto na fonte. Não adiciona modelos às cenas seguintes.
