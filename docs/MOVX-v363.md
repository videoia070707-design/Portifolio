# MOVX v363 — a TV vira o próprio controle

## Base preservada

A v363 continua em cima da v361 (quatro canais vivos) e da v362 (resposta tátil localizada). A CRT aprovada segue como o único GLB de produção, no mesmo contexto WebGL e no mesmo loop de render.

## Mudança principal

A interação deixa de depender só dos botões ao lado da TV. O objeto físico passa a controlar o conteúdo diretamente:

- **Direção** — arrastar horizontalmente a tela percorre as três artes reais; clique continua avançando uma por vez.
- **Motion** — arrastar a tela faz scrub do tempo. Se a animação estava tocando, ela pausa apenas durante o gesto e retoma ao soltar.
- **AI / Generativo** — arrastar verticalmente modifica a forma usando o mesmo parâmetro do controle de forma existente; clique continua gerando outra variação.
- **Digital** — arrastar a tela alterna desktop/mobile; clique continua disponível.
- **Seletor físico** — pode ser arrastado como dial para sintonizar os quatro canais. A rotação é amortecida e trabalha junto do pequeno kick mecânico da v362.

## Princípios

- O feedback acontece no objeto e no conteúdo, não por grandes poses da TV inteira.
- Os controles DOM continuam sendo a alternativa acessível de teclado/toque.
- Hover sozinho não troca canal.
- Touch coarse não captura gesto de arraste da TV e preserva scroll natural; as ações explícitas continuam funcionando.
- Reduced motion mantém os controles manuais e remove apenas a inércia decorativa.

## Arquitetura

- nenhum novo modelo 3D;
- nenhum novo canvas WebGL;
- nenhum novo requestAnimationFrame;
- nenhum pacote novo;
- o módulo `v363-crt-direct-manipulation.mjs` é chamado dentro do frame compartilhado já existente;
- a identidade do renderer continua `v358-crt-spatial-runtime`; v361/v362/v363 são capacidades incrementais.

## QA

`qa-v363-crt-direct-manipulation.cjs` cobre desktop, mobile e reduced-motion e verifica drag de Direção, scrub de Motion, deformação do Generativo, alternância do Digital, dial físico, 44.831 triângulos, um único canvas e ausência de overflow.

A revisão também corrige o contrato de performance que ainda exigia uma identidade de renderer `v362-crt-tactility-runtime`, embora o renderer aprovado permaneça v358.
