# MOVX — Research & Runtime Audit v37

## Objetivo
Aprimorar a passagem Arquivo Vivo → Territórios → Diretório e reduzir custo de animação/JavaScript acumulado ao longo das versões anteriores.

## Referências revisadas
- Behance — Creative Director Web | UX Strategy & Visual Design — quiet luxury, hierarquia clara, foco no trabalho e pouco motion decorativo.
  https://www.behance.net/gallery/244241017/Creative-Director-Web-UX-Strategy-Visual-Design
- Behance — Selected Works 2026 | Creative Director Portfolio — curadoria de trabalhos como sistema, misturando branding, campanhas, social, web e motion sem depender de UI pesada.
  https://www.behance.net/gallery/252976751/Selected-Works-2026-Creative-Director-Portfolio
- Dribbble — Stormie — Art Director Website Portfolio — headline editorial, microdetalhes, alinhamento e divisores como estrutura.
  https://dribbble.com/shots/27273906-Stormie-Art-Director-Website-Portfolio
- Dribbble — JH — Editorial Art Director Portfolio — grid estrito, tipografia grande, storytelling estruturado e UI mínima.
  https://dribbble.com/shots/27288946-JH-Editorial-Art-Director-Portfolio-Personal-Website-UI-Design
- Dribbble — Art Director Portfolio Work Page — imagens cinematográficas, hierarquia tipográfica e motion discreto.
  https://dribbble.com/shots/26757093-Art-Director-Portfolio-Work-Page
- Awwwards — Tom Sears project hover — interação de projeto baseada em tipografia + imagem, sem transformar o card em um objeto 3D.
  https://www.awwwards.com/inspiration/personal-project-portfolio-for-tom-sears
- Awwwards — Scroll Portfolio Gallery — galeria contínua e leitura do acervo via scroll/infinite gallery.
  https://www.awwwards.com/inspiration/scroll-portfolio-gallery-lm-al-c-portfolio-23
- Awwwards — Exhibition Page / Elektra Virtual Museum — estrutura de exposição com tipografia, scroll, hover e UI mínima.
  https://www.awwwards.com/inspiration/exhibition-page
- Awwwards — Donprod Portfolio project gallery — transições entre home, archive e project pages tratadas como um único sistema.
  https://www.awwwards.com/inspiration/project-gallery-donprod-portfolio-double-or-nothing
- Pinterest — Bastien Allard minimal one-page art director portfolio — grid de projetos com contraste forte entre índice e visualização.
  https://in.pinterest.com/pin/minimal-one-page-portfolio-for-art-director-bastien-allard-featuring-a-project-grid-that-opens-up-into-a-dark-mode--831336412471696426/

## Auditoria técnica encontrada
1. O build ainda mantinha o `initConveyorLoop()` original do ZIP, baseado em `requestAnimationFrame`.
2. Ao mesmo tempo, a camada v21 adicionava um segundo motor RAF para o mesmo Arquivo Vivo.
3. O ticker também possuía dois motores: o RAF original do ZIP e outro RAF da v21.
4. A v21 ainda adicionava uma antiga animação de entrada do case viewer, mesmo depois de v31/v33 já terem se tornado os proprietários dessa transição.
5. O tilt/spotlight legado continuava registrando `pointermove` em cards que versões recentes já mantinham estáticos.
6. O MutationObserver do preview da v31 observava o atributo `style` e o próprio callback escrevia no `style`, criando risco de realimentação e churn.
7. O runtime v30 disparava a classe `v30-theme-pop`, mas o keyframe existente estava conectado à classe `v28-theme-pop`.

## Decisão v37 — um proprietário por movimento
- Arquivo Vivo: CSS/compositor é o único proprietário do marquee.
- Ticker: CSS/compositor é o único proprietário do marquee.
- Ambos pausam fora da área útil e quando a aba fica oculta.
- Tilt legado e spotlight duplicado deixam de ser inicializados.
- Case viewer continua pertencendo às camadas editoriais v31/v33.
- O preview observer deixa de observar `style`.

## Direção visual aplicada
- Territórios passam de cards de dashboard para placas editoriais assimétricas.
- As imagens continuam importantes, mas títulos, numeração e descrições ficam mais próximos de índice de revista/exposição.
- Diretório recebe um ledger de filtros sticky em desktop, sem pills e sem sombras.
- Mudanças de filtro assentam a composição como um bloco; não há fly-in independente por card.
- O archive grid continua assimétrico, com chrome ainda mais baixo.
- `content-visibility:auto` é aplicado onde seguro para evitar trabalho de renderização abaixo da dobra.

## Regra permanente
Antes de adicionar uma animação nova, verificar se outro runtime já move o mesmo elemento. Um elemento deve ter um proprietário de transform/motion por vez.
