# MOVX — Plano de Immersive 3D Scroll

Data: 2026-09-19
Status: pesquisa e planejamento, sem aplicar nova camada visual ainda.

## Objetivo

Transformar o portfólio MOVX em uma experiência de direção criativa imersiva onde o scroll funcione como deslocamento espacial e narrativo, sem sacrificar legibilidade, densidade do portfólio ou a clareza das artes.

O site não deve virar uma demo técnica de WebGL. O trabalho continua sendo protagonista. O 3D deve reforçar narrativa, profundidade e ritmo nas seções institucionais e nas transições-chave.

## Pesquisa-base

Referências estudadas:

- Awwwards — 0110 Studio 3D Scroll Animation / 3D Page: https://www.awwwards.com/inspiration/3d-scroll-animation-0110-studio-portfolio-web
- Behance — Immersive website portfolio for developer: https://www.behance.net/gallery/238189427/Immersive-website-portfolio-for-developer
- Dribbble — Noomo Showcase / Immersive 3D Scroll: https://dribbble.com/shots/27574491-Noomo-Showcase-Immersive-3D-scroll
- Dribbble — About Us Scroll Animation / Abron Studio: https://dribbble.com/shots/27418799-About-Us-Scroll-Animation
- Dribbble — Tubik 3D Scroll Animation: https://dribbble.com/shots/26186494-3D-Scroll-Animation-for-a-Landing-Page
- Codrops — Scroll-Reactive 3D Gallery: https://tympanus.net/codrops/2026/03/09/building-a-scroll-reactive-3d-gallery-with-three-js-velocity-and-mood-based-backgrounds/
- Codrops — 3D Scroll-Driven Text Animations: https://tympanus.net/codrops/2025/11/04/creating-3d-scroll-driven-text-animations-with-css-and-gsap/
- Codrops — Blender Camera Path + Three.js + GSAP: https://tympanus.net/codrops/2026/07/07/building-a-scroll-driven-3d-gallery-using-a-blender-camera-path-with-three-js-and-gsap/
- GSAP ScrollTrigger docs: https://gsap.com/docs/v3/Plugins/ScrollTrigger/
- Three.js PerspectiveCamera docs: https://threejs.org/docs/pages/PerspectiveCamera.html
- YouTube — Codegrid, Three.js + GSAP scroll animation: https://www.youtube.com/watch?v=rbIbvw6c53k
- YouTube — Codegrid, product-page 3D scroll: https://www.youtube.com/watch?v=gIPk9j4byQs
- YouTube — APPROX Coding, full 3D scroll website with GSAP + Three.js: https://www.youtube.com/watch?v=3rtXNb5886U

## O que define um immersive 3D scroll de verdade

1. O scroll não dispara apenas animações; ele controla um estado espacial normalizado entre 0 e 1.
2. A câmera, objetos, planos, iluminação, escala e shaders respondem ao mesmo estado.
3. A experiência possui continuidade entre cenas, em vez de cada seção executar um efeito isolado.
4. Profundidade deve existir por separação real de planos Z, perspectiva e movimento diferencial.
5. Velocidade do scroll pode virar sinal visual secundário: inclinação, blur, displacement, breathing ou mudança de atmosfera.
6. Seções importantes podem ser pinned por uma distância controlada para que o usuário atravesse uma cena antes de retornar ao fluxo normal.
7. O texto funcional não deve sofrer transformações agressivas; o 3D fica em camadas, números, imagens, formas e elementos cenográficos.
8. O sistema precisa ter fallback mobile, reduced-motion, pausa fora da viewport e um único proprietário de render/motion.

## Arquitetura recomendada para MOVX

### Stack

Fase inicial: CSS 3D + JavaScript nativo para narrativa institucional.

Fase assinatura: Three.js + GSAP ScrollTrigger para uma única cena 3D persistente no trecho Sobre -> Serviços -> Processo -> Contato.

Não reintroduzir Lenis automaticamente. Só considerar scroll smoothing depois de provar que o scroll nativo + ScrollTrigger não entrega a sensação desejada.

### Estado central

scroll position
→ progresso normalizado da cena 0..1
→ capítulo ativo
→ posição e rotação da câmera
→ estado dos planos 3D
→ atmosfera / luz / cor
→ render frame

Scroll deve ser input, não o próprio motor de animação.

## Direção visual aplicada ao MOVX

### 1. Sobre mim — Entrada na dimensão autoral

Objetivo: sair do portfólio de trabalhos e entrar no universo do criador.

- seção com 140–180vh de percurso
- headline principal permanece legível e próxima ao plano frontal
- palavra gigante SOBRE/MOVX atrás em Z negativo
- duas ou três placas tipográficas ou fragmentos visuais em profundidades diferentes
- pequeno deslocamento lateral de câmera
- background passa de plano para uma sensação de sala editorial
- parallax perceptível, mas não caótico

### 2. Serviços — Galeria espacial de competências

Objetivo: cada serviço ser percebido como uma camada da prática criativa.

- seção pinned curta
- serviços continuam como linhas editoriais no DOM
- números 01–04/05 ocupam planos 3D enormes ao fundo
- conforme o scroll avança, o número seguinte vem de trás da câmera ou de Z negativo até a linha de leitura
- divisores, shapes e palavras-chave passam em profundidades diferentes
- serviço ativo ganha presença por contraste e foco, não por card ou pop-up

### 3. Processo — Principal assinatura 3D

Objetivo: ser o trecho mais imersivo e memorável do site.

- pin de aproximadamente 300–500vh
- passos 01→05 distribuídos em um corredor espacial
- câmera avança continuamente no eixo Z
- cada etapa entra em foco quando se aproxima da câmera
- elementos distantes ficam silenciosos e dessaturados
- números podem inclinar e passar lateralmente
- linhas estruturais convergem para um ponto de fuga
- scroll velocity adiciona uma pequena inclinação ou deslocamento extra
- copy real permanece em uma camada DOM sincronizada com cada estação

### 4. Contato — Saída da cena

Objetivo: desacelerar e concluir a narrativa.

- câmera sai do corredor e abre o campo visual
- formas convergem ou se dissolvem
- palavra CONTATO aparece em profundidade e se estabiliza
- formulário continua plano e plenamente utilizável
- cena 3D desacelera e encerra sem loop infinito

## Papel das outras seções

Hero: manter parallax e profundidade existentes, mas sem competir com a arte principal.

Arquivo Vivo: manter movimento editorial horizontal, sem transformar em corredor WebGL permanente.

Territórios: parallax moderado de mídia, sem inclinação extrema.

Diretório: priorizar organização e leitura; nada de 3D estrutural pesado.

Casos selecionados: manter portal ao abrir projeto como assinatura curta, sem cenário WebGL persistente atrás do grid.

Cases: 3D apenas como transição entre peças ou plano de profundidade leve; nunca distorcer a obra.

## Técnica da câmera

Usar PerspectiveCamera para as cenas realmente espaciais.

Proposta inicial:

- FOV: 38–50
- near: 0.1
- far: suficiente para o corredor completo
- câmera seguindo uma linha/curva simples na primeira implementação
- posteriormente Catmull-Rom ou curva desenhada em Blender caso a versão linear fique limitada

Não começar com Blender. Primeiro validar narrativa, amplitude, pacing e legibilidade usando uma curva procedural simples. Blender camera path entra somente se o protótipo aprovado exigir uma trajetória realmente cinematográfica.

## ScrollTrigger

Usar ScrollTrigger para:

- progresso 0..1 da cena
- pin da seção de Processo
- scrub suave
- ativação/desativação de render
- callbacks de capítulo
- refresh em resize

Evitar animar diretamente o elemento que está pinned; o conteúdo 3D deve ficar dentro dele.

## Performance budget

Desktop:
- apenas uma cena WebGL ativa neste trecho
- DPR limitado a 1.5
- texturas preferencialmente 1024–2048 px
- poucos planos simultaneamente visíveis
- evitar sombras em tempo real
- usar materiais simples + shader leve
- pausar render fora da viewport

Mobile/tablet:
- reduzir quantidade de planos
- reduzir amplitude Z/rotação
- DPR <= 1
- permitir versão CSS 3D ou flat se GPU/dispositivo não sustentar a cena

Acessibilidade:
- prefers-reduced-motion desativa pin cinematográfico e devolve fluxo editorial normal
- conteúdo DOM existe independentemente do canvas
- canvas aria-hidden
- nada essencial exclusivamente dentro do WebGL

## Fases de implementação

### F0 — Baseline visual
Congelar a v42 como referência de organização. Screenshot/QA desktop e mobile. Nenhuma alteração visual grande antes de ter baseline.

### F1 — Parallax institucional forte em CSS 3D
Aplicar e calibrar Sobre, Serviços, Processo e Contato com planos Z visíveis. Sem WebGL. Objetivo: provar direção visual.

### F2 — Scene controller
Criar um controlador único de progresso para o trecho institucional, com IntersectionObserver + rAF e estado 0..1 por capítulo.

### F3 — Processo 3D real
Introduzir Three.js apenas no Processo. Criar corredor de números/linhas/placas e câmera scroll-scrubbed. Validar performance.

### F4 — Cena persistente Sobre→Contato
Se F3 passar, estender a mesma scene/camera para quatro capítulos. Fazer transições espaciais entre Sobre, Serviços, Processo e Contato.

### F5 — Atmosfera
Adicionar mudanças sutis de luz, paleta, fog e shader conforme capítulo e velocidade do scroll.

### F6 — Pointer parallax
Adicionar ponteiro como sinal secundário, nunca como controlador principal. Amplitude baixa.

### F7 — Mobile/reduced motion
Criar experiência alternativa explícita. Não tentar miniaturizar a experiência desktop inteira.

### F8 — QA/performance
FPS, scroll jank, memory, resize, tab hidden, WebGL context lost, largura 1440/1280/1024/820/390.

### F9 — Polish
Microtransições, tipografia, transição entrada/saída da cena, sincronização precisa com capítulos.

## Critérios de aprovação

- usuário percebe 3D sem precisar procurar pelo efeito
- Sobre/Serviços/Processo/Contato ganham profundidade, mas continuam legíveis
- Processo é a assinatura principal
- Diretório permanece limpo e funcional
- nenhuma arte é deformada ou cortada para sustentar o efeito
- um único motion owner por transform
- sem regressão de layout
- mobile continua profissional mesmo sem cena completa
- experiência melhora o portfólio, não vira demo técnica

## Prompt mestre para implementação assistida

Use este formato para qualquer implementação futura:

"Evolua o MOVX Creative Portfolio para uma experiência immersive 3D scroll de direção criativa, mantendo a v42 como baseline visual. O trabalho visual e a tipografia editorial são protagonistas; o 3D deve construir profundidade e narrativa, não virar uma demo técnica. Crie uma cena contínua principalmente entre Sobre Mim, Serviços, Processo e Contato. Trate scroll como input normalizado 0..1 e use um único motion/render owner. O Processo deve ser a assinatura principal, com câmera avançando por um corredor de etapas 01–05 em profundidade. Sobre deve introduzir a dimensão autoral; Serviços deve usar grandes números/placas em Z; Contato deve desacelerar e encerrar a cena. Preserve todo o texto funcional no DOM e evite transforms agressivos em copy. Priorize CSS 3D no primeiro protótipo e introduza Three.js + GSAP ScrollTrigger apenas na cena que realmente precisar de espaço 3D. Implemente fallback, prefers-reduced-motion, viewport gating, DPR limitado, resize seguro e pausa fora da viewport. Não reintroduza grids vazios, cards SaaS, WebGL permanente no Diretório, ou animações que prejudiquem leitura. Antes de expandir, valide cada fase visualmente e em performance." 

## Conclusão

Para o MOVX, immersive 3D scroll deve funcionar como uma câmera atravessando a identidade do criador, não como um efeito aplicado em toda miniatura. A melhor zona para concentrar complexidade é Sobre -> Serviços -> Processo -> Contato, com Processo como clímax. O Diretório e as artes devem voltar a ser silenciosos, densos e funcionais.