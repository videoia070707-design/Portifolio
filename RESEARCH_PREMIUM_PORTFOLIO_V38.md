# MOVX — Research Premium Portfolio v38

## Objetivo
Refinar a seção real de casos selecionados (`#projectsList`), melhorar acessibilidade/teclado e reduzir trabalho por frame sem adicionar efeitos genéricos.

## Referências estudadas
- Dribbble — JH — Editorial Art Director Portfolio Works Page
  https://dribbble.com/shots/27302103-JH-Editorial-Art-Director-Portfolio-Personal-Website-Works-Page
  - grid rigoroso, tipografia grande, seções de projeto legíveis e narrativa modular.
- Dribbble — Meera Knowles — Art Director Portfolio
  https://dribbble.com/shots/27691848-Meera-Knowles-Art-Director-Portfolio-Website
  - sistema de case study que respeita formatos de mídia diferentes e mantém consistência responsiva.
- Dribbble — Veloura Photographer Portfolio
  https://dribbble.com/shots/25866862-Veloura-Photographer-portfolio-website
  - grid claro, respiro e hierarquia calma para deixar cada projeto se destacar.
- Awwwards — Tom Sears Personal Portfolio — Project Hover
  https://www.awwwards.com/inspiration/personal-project-portfolio-for-tom-sears
  - hover como prévia do projeto, sem transformar a interface em um dashboard.
- Awwwards — Donprod Portfolio — Mobile Archive / Project Gallery
  https://www.awwwards.com/inspiration/archive-mobile-donprod-portfolio-double-or-nothing
  https://www.awwwards.com/inspiration/project-gallery-donprod-portfolio-double-or-nothing
  - arquivo, filtros e projeto conectados como um único fluxo; mobile recebe uma composição própria.
- Awwwards — Dave Holloway
  https://www.awwwards.com/inspiration/thumbnail-submission-656a137b45a3e941002196
  - project hover, next-project transition e scrolling project page tratados como partes da mesma experiência.

## Auditoria aplicada
1. O `#projectsList` atual usa `.project-entry`, mas camadas antigas de v34 foram desenhadas para `.selected-index-row`, uma estrutura que não existe no HTML publicado. A v38 passa a trabalhar na estrutura real.
2. Cards clicáveis do diretório/capa de projeto não eram todos alcançáveis por teclado; v38 adiciona semântica e Enter/Space.
3. O case viewer ganha `role=dialog`, `aria-modal`, foco inicial, contenção de Tab e restauração de foco ao fechar.
4. O runtime v30 ainda fazia leituras de layout diretamente em cada evento de scroll. O build v38 agenda isso via `requestAnimationFrame`.
5. A barra de progresso do case também passa a atualizar no máximo uma vez por frame.
6. Capas de projetos próximos da viewport são decodificadas antecipadamente, sem tornar o carregamento inicial agressivo.

## Direção visual
- cada case funciona como spread editorial: copy sticky + imagem dominante;
- alternância de lado é estrutural, não decorativa;
- tags perdem linguagem de chip/pill;
- CTA vira ação tipográfica;
- hover move apenas a imagem em escala mínima;
- cor do projeto aparece só como micro-acento;
- mobile vira uma única coluna, sem manter assimetria à força.

## Regra de continuidade
Não adicionar glow, glassmorphism, tilt de card, partículas ou animação independente de linhas de texto. O motion deve apoiar navegação, hierarquia e troca de contexto.
