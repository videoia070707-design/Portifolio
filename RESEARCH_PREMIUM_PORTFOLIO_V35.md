# MOVX v35 — Pesquisa de ritmo narrativo e portfólio editorial

## Objetivo
Transformar a página principal em uma narrativa contínua, reduzindo a sensação de seções empilhadas. A interface deve desaparecer atrás do trabalho: menos chrome, menos ornamento, mais composição, tipografia, ritmo e transições discretas.

## Referências estudadas
- Awwwards — Scroll Portfolio / Humbert & Poyet: https://www.awwwards.com/inspiration/scroll-portfolio
- Awwwards — LM / AL Portfolio 23 Scroll Gallery: https://www.awwwards.com/inspiration/scroll-portfolio-gallery-lm-al-c-portfolio-23
- Awwwards — Tom Sears Portfolio Hover Project Interaction: https://www.awwwards.com/inspiration/personal-project-portfolio-for-tom-sears
- Awwwards — Z1 Digital Studio process navigation: https://www.awwwards.com/inspiration/process-navigation-side-scrolling-z1-digital-studio
- Behance — Luiza Bola Studio Website: https://www.behance.net/gallery/224559725/Luiza-Bola-Studio-Website
- Behance — Sasha Satchi: https://www.behance.net/gallery/245222237/Sasha-Satchi
- Behance — Jackie Farkas Art Director Portfolio: https://www.behance.net/gallery/228367969/Jackie-Farkas-Los-Angeles-Art-Director-Portfolio-Site
- Dribbble — Editorial Portfolio Horizontal Scroll Gallery: https://dribbble.com/shots/27080236-Editorial-Portfolio-Horizontal-Scroll-Gallery
- Dribbble — Coetzee Creative Projects Showcase: https://dribbble.com/shots/26732402-Coetzee-Creative-Projects-Showcase-UX-Scroll-Animation
- Dribbble — Art Director Portfolio Homepage: https://dribbble.com/shots/26645929-Art-Director-Personal-Portfolio-Homepage
- Pinterest — creative director / typography / interactive animation reference: https://in.pinterest.com/pin/digital-designer-art-director-specialist-in-typography-interactive-animations-and-a--99853316732288082/

## Padrões extraídos
1. O scroll deve conectar capítulos, não disparar efeitos diferentes em cada bloco.
2. Títulos grandes e imagens fortes funcionam melhor quando a UI é quase invisível.
3. Uma pequena mudança de tom de fundo entre capítulos cria ritmo sem precisar de gradientes, glow ou cards.
4. Linhas editoriais e numeração funcionam como estrutura; não precisam virar componentes de interface.
5. Processos longos ganham leitura quando um título permanece estável e apenas o passo atual recebe ênfase.
6. Formulários premium tendem a funcionar melhor como tipografia + linhas, em vez de campos com caixas arredondadas.
7. Hovers devem reforçar foco com opacidade, escala mínima e regras, não com tilt, bounce ou deslocamentos grandes.
8. Em telas pequenas, a assimetria deve colapsar cedo para preservar leitura.

## Decisões aplicadas na v35
- indicador lateral único de capítulo em desktop;
- linhas de abertura de capítulo que revelam uma vez, sem mover texto;
- alternância tonal quase imperceptível entre seções;
- About transformado em spread editorial 12 colunas;
- Services refeito como índice tipográfico sem hover-card;
- Process com título sticky e ênfase progressiva no passo ativo;
- Contact refeito como fechamento editorial escuro, com formulário por linhas;
- nenhum título/parágrafo recebe transform independente;
- `prefers-reduced-motion` continua respeitado;
- comportamento fail-open: conteúdo permanece legível sem JS.

## Mobbin
O conector está instalado, porém a busca via MCP retornou novamente que requer plano pago. Nenhuma tela do Mobbin foi tratada como referência visual efetivamente inspecionada nesta rodada.
