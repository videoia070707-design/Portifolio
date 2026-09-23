"""Package an already built MOVX into a local, double-clickable folder.
Usage: python3 scripts/package-local-preview.py ESBUILD_BIN DESTINATION
No git or deployment commands are used.
"""
from pathlib import Path
import sys,shutil,re,subprocess,json
root=Path(__file__).resolve().parents[1]
esbuild=Path(sys.argv[1]).resolve();dest=Path(sys.argv[2]).resolve()
dest.mkdir(parents=True,exist_ok=True)
shutil.copytree(root/'_site',dest,dirs_exist_ok=True)
compiled=set()
for html in dest.rglob('*.html'):
    text=html.read_text()
    pattern=r'<script\s+type="module"\s+src="([^"?]+)(?:\?[^\"]*)?"\s*>\s*</script>'
    def replace(m):
        src=(html.parent/m[1]).resolve()
        if src not in compiled:
            output=src.with_suffix('.local.js')
            subprocess.run([str(esbuild),str(src),'--bundle','--format=iife','--target=es2020','--minify',f'--outfile={output}'],check=True,capture_output=True)
            compiled.add(src)
        return f'<script defer src="{m[1].removesuffix(".mjs")}.local.js"></script>'
    text=re.sub(pattern,replace,text)
    html.write_text(text)
(dest/'LEIA-ME.txt').write_text('''MOVX — PREVIEW LOCAL / sem publicação

1. Extraia o ZIP inteiro.
2. Abra index.html no Chrome ou Edge atualizado.
3. Role depois da capa Soul of Design: o vídeo avança com o scroll.
4. Role para cima para voltar o vídeo. Trabalhos, categorias e cases continuam disponíveis.

Não abra index.html de dentro do ZIP. Mantenha as pastas ao lado dele.
O vídeo e as artes estão incluídos. Fontes externas podem usar internet.
Se seu navegador restringir arquivos locais, rode "python -m http.server 4173"
na pasta extraída e abra http://localhost:4173.

Movimento reduzido do sistema ou ?static na URL mostra uma imagem estática.
Este pacote não envia nada ao GitHub e não altera o site publicado.

Base: v116, commit 59f55cc, obtido em 23/09/2026.
Vídeo fornecido: 0923.mp4; cópia H.264 local, 1600 × 900, sem áudio.
Verificados: build, referências locais, mídia e lógica de avanço/retorno,
buscas durante rolagem rápida, movimento reduzido e falha de carregamento.
Limitação: a inspeção visual em navegador do preview local ficou bloqueada
nesta sessão. A aparência e a fluidez ainda precisam de revisão no aparelho.
''')
print(json.dumps({'output':str(dest),'bundled_modules':len(compiled)}))
