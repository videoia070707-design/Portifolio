# MOVX — Research WebGL v40

## Objetivo
Subir o portfólio de CSS-3D/parallax para uma cena WebGL realmente sincronizada ao scroll sem voltar a depender de runtimes externos frágeis.

## Referências estudadas
- Codrops — Building a Scroll-Reactive 3D Gallery with Three.js, Velocity, and Mood-Based Backgrounds (2026): galeria em profundidade, velocidade do scroll influenciando movimento e imagens distribuídas no eixo Z.
  https://tympanus.net/codrops/2026/03/09/building-a-scroll-reactive-3d-gallery-with-three-js-velocity-and-mood-based-backgrounds/
- Codrops — Building a Scroll-Revealed WebGL Gallery with GSAP, Three.js, Astro and Barba.js (2026): sincronização entre DOM e planos WebGL e continuidade entre galeria e detalhe.
  https://tympanus.net/codrops/2026/02/02/building-a-scroll-revealed-webgl-gallery-with-gsap-three-js-astro-and-barba-js/
- Codrops — More Than a Portfolio: Building a Scroll-Driven 3D World with Something to Say (2026): o 3D deve servir a narrativa; câmera, profundidade e cena precisam compor uma experiência e não um efeito isolado.
  https://tympanus.net/codrops/2026/04/28/more-than-a-portfolio-building-a-scroll-driven-3d-world-with-something-to-say/
- Codrops — Creating a Smooth Horizontal Parallax Gallery: From DOM to WebGL (2026): mover trabalho pesado de paralaxe para GPU quando a galeria cresce em complexidade.
  https://tympanus.net/codrops/2026/02/19/creating-a-smooth-horizontal-parallax-gallery-from-dom-to-webgl/

## Decisão para o MOVX
A v40 usa WebGL nativo em vez de incluir Three.js/GSAP/Lenis externos. O objetivo é obter uma cena 3D real com o menor novo risco de dependência possível.

## Arquitetura
- Canvas WebGL sticky atrás de Casos Selecionados.
- Capas reais dos projetos usadas como texturas.
- Planos distribuídos ao longo do eixo Z.
- Scroll move uma câmera lógica pelo corredor de projetos.
- Velocidade do scroll curva a geometria no vertex shader.
- Ponteiro adiciona deriva/rotação sem substituir a coreografia de scroll.
- Shader reduz saturação dos planos distantes e devolve cor aos planos em foco.
- Malha subdividida permite deformação real da superfície, não apenas um quad rígido.
- DOM continua sendo a camada acessível e clicável; WebGL é apenas uma camada narrativa.

## Performance
- Canvas só renderiza quando a seção está perto da viewport.
- DPR limitado a 1.5.
- Sem antialias/motion extra fora da cena.
- Texturas usam as capas já existentes no projeto.
- Context loss falha aberto: o canvas some e o site DOM continua funcionando.
- prefers-reduced-motion mantém o site sem a cena.

## Regra
WebGL não pode substituir conteúdo, navegação ou legibilidade. A cena deve ampliar a profundidade da experiência enquanto o portfólio continua utilizável se a GPU, o shader ou o canvas falharem.
