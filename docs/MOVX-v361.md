# MOVX v361 — a TV como central de canais

A v360 tratava os canais como poses do produto. Isso não cumpria a intenção de imersão: o usuário movimentava a embalagem sem explorar conteúdo. Esta revisão troca esse contrato.

## Experiência

- Direção: três artes existentes (Voltara, Hardwork e Belive), preservadas por inteiro. A tela física e o botão acessível avançam o trabalho.
- Motion: composição tipográfica animada, reprodução/pausa e ajuste de ritmo. Pausada, a régua permite explorar quadros.
- AI: estudo visual generativo local com variação e forma ajustáveis. Não chama modelo de IA nem se apresenta como case de cliente.
- Digital: demonstração de layout adaptativo, alternando desktop/mobile.
- O seletor físico da TV avança os canais; os quatro botões continuam disponíveis para toque e teclado. Hover não muda o canal.

## Direção e preservação

Retoma os princípios registrados em RESEARCH_IMMERSIVE_3D_SCROLL_PLAN.md: conteúdo e estado espacial precisam ter significado conjunto; arte real é prioridade; não transformar o portfólio em demo de WebGL. Os documentos locais foram consultados; não se afirma nova inspeção dos sites históricos.

Mantém o GLB aprovado (17 meshes, 44.831 triângulos), as páginas de serviços e os outros modelos desativados. O material do vidro existente recebe conteúdo projetado pela posição local da malha, preservando curvatura e reflexos. Nenhuma tela/plano 3D adicional, nenhum novo contexto WebGL e nenhum pacote novo.

A rotação foi reduzida a apoio discreto. Conteúdo e controles mudam juntos; o painel reserva espaço para evitar saltos. A transição é uma única passagem escura, sem ruído estroboscópico.

## Desempenho e acesso

Canvas 768 × 544, atualizado no máximo 24 vezes por segundo e apenas pelo loop do renderer existente. Canais estáticos não atualizam a textura continuamente. A atualização para fora da área visível. Movimento reduzido começa pausado, mantendo todas as ações manuais. Links para o portfólio funcionam sem a camada interativa.

## Verificação

qa-v361-channel-experience.cjs cobre mudança efetiva da textura, seleção explícita, clique na malha da tela/seletor, pausa, reprodução, ajuste, variações e layout responsivo. Mantém os gates anteriores de carregamento, modelo único, conteúdo e layout. A comparação visual da v360 que exigia grandes giros foi substituída pelo comportamento solicitado.
