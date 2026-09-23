# MOVX v117 — scroll world com vídeo 0923

O MOVX usa o vídeo indicado pelo proprietário (`0923.mp4`) como uma tomada contínua entre a capa e o Arquivo em Movimento. A rolagem controla o tempo do vídeo; a filmagem contém o movimento de câmera. Um plano CSS em perspectiva só faz a entrada e a saída da seção.

## Implementação

- `site/v117-scroll-world.html`: uma seção fixa com pôster, vídeo e progresso mínimo.
- `site/v117-scroll-world.css`: enquadramento, entrada espacial, composição completa no celular e fallback para movimento reduzido.
- `site/v117-scroll-world.mjs`: carrega o vídeo como Blob para seek confiável em hospedagens sem suporte a byte ranges; coordena apenas um seek por vez, mantém o pôster até o primeiro quadro, troca a versão leve em telas pequenas e libera o Blob ao sair.
- `scripts/build-v117.py`: instala a seção somente nas três páginas com a capa Social Media, substituindo o efeito procedural v107.

As técnicas de Blob seek, coalescência de seeks, pôster e fallback vêm da skill `scroll-world` fornecida no pacote do usuário, versão 0.8.0, licença MIT. O motor completo de múltiplos clipes não foi copiado porque esta entrega usa uma única tomada pronta, sem emendas ou cenas geradas.

O vídeo de origem é HEVC 2560×1440, 9,75 s. A cópia para desktop é H.264 1920×1080, GOP 8, sem áudio. A versão para celular é H.264 960×540, GOP 4 e mostra o enquadramento completo. Há também uma alternativa WebM VP9 para navegadores sem H.264. A versão móvel é leve e em paisagem; não equivale à versão nativa 9:16 descrita na skill.

## Verificação

`npm ci && npm run build` deve incluir a seção nas páginas `index.html`, `latest.html` e `social-media.html`, com os três recursos locais. Valide no navegador: entrada após a capa, rolagem para baixo e para cima, mudança de tema, celular, erro de rede e `prefers-reduced-motion`.
