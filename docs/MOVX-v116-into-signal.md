# MOVX — Into the Signal / Scroll World

## Objetivo
Inserir o filme `Into the Signal` entre a capa `Soul of Design` e o `Living Archive`, usando como fonte canônica o vídeo:

`https://res.cloudinary.com/gp3xbngz/video/upload/v1790173902/0923.mp4`

A cena continua isolada: não substitui o hero, não cria um segundo motor global de scroll e não interfere no Living Archive.

## Arquitetura Scroll World aplicada
A implementação segue a lógica da skill `scroll-world`:
- stage cinematográfico sticky/fixo durante o capítulo;
- `scroll progress -> video.currentTime`;
- progressão suavizada por damping/lerp;
- seeks coalescidos por `requestAnimationFrame`;
- abertura com `linger` antes da travessia;
- progressão segmentada para preservar leitura visual;
- crossfade do poster para o primeiro frame decodificado;
- handoff no final para o arquivo DOM real;
- tentativa de Blob loading do Cloudinary para reduzir stalls de seek;
- fallback para reprodução direta do Cloudinary quando Blob/CORS não estiver disponível;
- fallback local VP9/H.264 somente se a mídia remota falhar;
- `prefers-reduced-motion` permanece estático, sem download do vídeo.

## Curva de scroll
- 0–8%: hold inicial;
- 8–42%: Signal — entrada progressiva;
- 42–58%: Crossing — avanço mais rápido;
- 58–90%: Archive — maior janela de exploração;
- 90–100%: desaceleração + handoff.

## Profundidade 3D
O plano do filme passa a usar `perspective + translateZ + rotateX + rotateY + scale`.
Desktop começa mais recuado no eixo Z e assenta progressivamente.
Mobile preserva o quadro 16:9, mas aplica zoom espacial mais forte no Crossing e recua antes do handoff.

## Ciclo de mídia
1. A seção entra na zona de aproximação via `IntersectionObserver`.
2. O runtime tenta buscar `0923.mp4` como Blob com timeout curto.
3. Se funcionar, o `<video>` usa `blob:` como fonte local em memória.
4. Se Blob/CORS falhar, usa o URL Cloudinary diretamente.
5. Se a reprodução remota falhar, cai para os encodes locais já existentes.
6. Em reduced-motion o vídeo não recebe `src`.

## QA
`scripts/qa-v116.cjs` valida:
- URL Cloudinary declarada exatamente;
- fonte ativa Cloudinary Blob/direta ou fallback local resiliente;
- scrub temporal monotônico em desktop e mobile;
- sticky stage e ausência de overflow;
- profundidade Z e zoom mobile;
- handoff final;
- hero e Living Archive preservados;
- reduced-motion sem download de filme.

## Release
O build identifica esta evolução como `v117-scroll-world-cloudinary`, preservando os nomes de arquivo v116 para evitar quebra do pipeline existente.
