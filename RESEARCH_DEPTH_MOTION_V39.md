# MOVX v39 — Pesquisa e decisão de motion com profundidade

## Diagnóstico
As versões v28–v38 tinham perspectiva e microparallax, mas a amplitude era deliberadamente baixa e vários efeitos eram neutralizados por camadas posteriores de CSS. O foco recente foi estabilidade, legibilidade e remoção de motores concorrentes. Resultado: motion mais confiável, porém parallax e profundidade pouco perceptíveis.

## Mudança de prioridade na v39
A v39 torna profundidade uma linguagem principal em áreas de imagem, mantendo texto e layout estáveis.

### Referências
- Awwwards — 0110 Studio / 3D Scroll Animation: https://www.awwwards.com/inspiration/3d-scroll-animation-0110-studio-portfolio-web
- Awwwards — OKCC Labs / Work scroll animation: https://www.awwwards.com/inspiration/work-scroll-animation-okcc-labs
- Dribbble — 3D Scroll Animation for a Landing Page / tubik: https://dribbble.com/shots/26186494-3D-Scroll-Animation-for-a-Landing-Page
- Dribbble — Parallax Portfolio Website Design Animation: https://dribbble.com/shots/23136625-Parallax-Portfolio-Website-Design-Animation
- Dribbble — Portfolio Website / Landing Page with 3D staircase + parallax: https://dribbble.com/shots/25066206-Portfolio-Website-Landing-Page

## Princípios aplicados
1. Profundidade precisa ser perceptível, não apenas tecnicamente existente.
2. Um mesmo elemento continua tendo um único proprietário de transform.
3. Texto não participa de rotação 3D; a profundidade vive nos planos de mídia.
4. Hero usa múltiplos planos com Z real em CSS 3D e movimento distinto por camada.
5. Arquivo Vivo mantém movimento horizontal no track e recebe 3D scroll no container da linha, evitando conflito.
6. Territórios usam mídia em plano separado da copy.
7. Casos Selecionados usam perspectiva, rotateX/rotateY, translateZ e parallax interno da imagem ligados ao scroll.
8. Case viewer usa shallow-3D nas pranchas durante a leitura.
9. Pointer adiciona paralaxe local sem substituir o estado de scroll.
10. IntersectionObserver limita o cálculo às regiões próximas da viewport; o scheduler usa um único requestAnimationFrame.

## 3D real vs. WebGL
Esta etapa implementa 3D espacial real via CSS perspective/translateZ/rotateX/rotateY sobre as artes existentes. Experiências com objeto 3D modelado, shader e câmera WebGL — como a referência 0110 Studio — exigem uma cena Three.js/WebGL e assets/modelos 3D próprios. Isso pode ser uma etapa posterior sem precisar comprometer o portfólio atual.
