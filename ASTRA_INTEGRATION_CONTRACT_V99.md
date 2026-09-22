# MOVX v99 — Astra / Work Integration Contract

## Decisão de arquitetura

Os objetos visuais pesados do MOVX — cenas 2D, objetos 3D, WebGL autoral, objetos com profundidade ligada ao scroll e animações generativas mais complexas — ficam reservados para a etapa de criação no Astra dentro do Work.

A camada principal do site continua responsável por layout, tipografia, conteúdo, acessibilidade, navegação, filtros, cases, QA e pelo único motion owner de scroll.

Astra NÃO deve criar um segundo controlador global de scroll.

## Runtime de integração

A v99 expõe `window.MOVX_MOTION_BRIDGE`.

Contrato atual:

- `version`: `v99-astra-ready`
- `reducedMotion`: informa se movimento reduzido está ativo
- `getSnapshot()`: retorna o estado atual do motion system
- `getStageNode(key)`: retorna o nó DOM de um capítulo
- `subscribe(listener)`: recebe snapshots contínuos do motion owner e retorna uma função de unsubscribe

O elemento `<html>` também expõe:

- `data-movx-motion="v96-normalized-damped-continuity"`
- `data-movx-motion-detail="v98-continuous-media-response"`
- `data-movx-motion-bridge="v99-astra-ready"`
- `data-movx-astra-objects="deferred-to-work"`
- `data-movx-current-chapter`
- `data-movx-chapter-index`
- `data-movx-scroll-direction`

## Sinais disponíveis

Cada capítulo recebe:

- `data-movx-stage`
- `data-movx-stage-index`
- `--v99-stage-progress`
- `--v99-stage-focus`
- `--v99-stage-enter`
- `--v99-stage-presence`

O root recebe:

- `--v94-page-progress`
- `--v97-motion-energy`
- `--v99-motion-energy`

O snapshot da bridge entrega:

- capítulo atual
- índice do capítulo
- direção do scroll
- progresso global da página
- energia do movimento
- progress/focus/enter/presence de cada stage

## Eventos

A troca de capítulo dispara:

`movx:chapterchange`

`event.detail` contém:

- `previous`
- `current`
- `index`

## Regras para objetos Astra

1. Não alterar tipografia, grid ou posição de texto via scroll.
2. Não adicionar HUDs, glassmorphism, cards artificiais, microdados ou ornamentos genéricos.
3. Objetos devem existir como direção de arte, não como demonstração técnica de 3D.
4. Todo objeto ligado ao scroll deve consumir `MOVX_MOTION_BRIDGE` ou os sinais CSS já publicados.
5. Não criar `window.onscroll`, outro smooth-scroll engine ou outro RAF global concorrente.
6. WebGL pesado deve ser lazy-mounted apenas quando o stage relevante se aproxima da viewport.
7. Desmontar ou congelar cenas fora de foco quando possível.
8. Em `prefers-reduced-motion`, a cena deve ficar estática ou usar uma representação editorial equivalente.
9. Mobile deve ter fallback explícito; não reduzir desktop 3D cegamente.
10. A arte do portfólio continua protagonista. O 2D/3D funciona como transição, profundidade ou assinatura.

## Prioridade visual sugerida para a etapa Astra

Primeiro lote:

- Hero → Living Archive: objeto/assinatura que atravessa a passagem sem cobrir texto
- Living Archive → Territórios: continuidade espacial baseada no fold mark já existente
- Territórios: profundidade localizada em fotografia/objeto, sem inclinar os textos
- Territórios → Cases: transição de matéria/forma para o diretório editorial

Segundo lote:

- abertura de case selecionado com passagem espacial curta
- objeto contextual por case apenas quando fizer sentido para a direção visual
- transição About → Services → Process com uma única linguagem material

## Gate obrigatório

Toda integração Astra deve passar pelos QAs atuais de:

- text integrity
- mobile archive
- directory mobile
- case mobile
- reserved pages
- motion quality

Além disso, futuras cenas Astra devem ganhar um gate próprio de performance e lifecycle antes de serem consideradas produção.
