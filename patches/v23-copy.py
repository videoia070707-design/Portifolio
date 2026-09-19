from pathlib import Path
import sys
root=Path(sys.argv[1]) if len(sys.argv)>1 else Path('.')
html=root/'social-media.html'
text=html.read_text(encoding='utf-8')
text=text.replace('data-i18n="home.aboutBody">Cada projeto começa por leitura de contexto, referências e intenção. Depois vêm hierarquia, ritmo, tipografia, imagem e movimento.</p>','data-i18n="home.servicesIntro">Entro onde o projeto precisa de direção: da linguagem inicial à expansão de uma campanha em formatos, canais e ritmos diferentes.</p>')
html.write_text(text,encoding='utf-8')

p=root/'i18n.js'
s=p.read_text(encoding='utf-8')
repls={
'"home.aboutKicker": "SOBRE / COMO EU PENSO"':'"home.aboutKicker": "SOBRE / PONTO DE VISTA"',
'"home.aboutTitle": "Construo linguagem<br>antes de construir peças"':'"home.aboutTitle": "Direção que transforma repertório<br>em identidade"',
'"home.aboutLead": "Trabalho na interseção entre direção de arte, social, vídeo e tecnologia de ponta. Em vez de acumular peças isoladas, construo sistemas visuais capazes de manter identidade, variar com intenção e crescer junto com a marca."':'"home.aboutLead": "Meu trabalho começa antes da peça: na leitura da marca, do mercado e do que precisa ficar na memória. Direção de arte, social, vídeo e tecnologia se encontram para construir uma presença reconhecível — e flexível o bastante para evoluir."',
'"home.aboutBody": "Começo entendendo contexto, posicionamento e o que precisa ser percebido. A partir daí, referências viram critérios; tipografia, imagem, cor, composição e movimento passam a cumprir funções claras. O resultado é uma linguagem que parece própria — não um conjunto de tendências."':'"home.aboutBody": "Não uso referência como atalho. Uso como matéria-prima para criar regras próprias de composição, imagem, tipografia, ritmo e movimento. Assim, cada entrega pertence ao mesmo universo sem cair no mesmo template."',
'"home.servicesTitle": "Estratégia visual<br>que vira sistema"':'"home.servicesTitle": "Da intenção<br>ao impacto visual"',
'"home.servicesKicker": "SERVIÇOS / DO CONCEITO À ENTREGA"':'"home.servicesKicker": "SERVIÇOS / ONDE EU ENTRO NO PROJETO"',
'"home.service1Text": "Posicionamento visual, conceito, referências, direção fotográfica, tipografia, paleta e regras de linguagem para dar uma assinatura reconhecível à marca."':'"home.service1Text": "Conceito, direção fotográfica, tipografia, paleta e regras de composição reunidas numa direção capaz de sustentar marca e campanha."',
'"home.service2Text": "Carrosséis, campanhas e ecossistemas de conteúdo pensados em série: cada peça cumpre uma função, sem repetir o mesmo template."':'"home.service2Text": "Carrosséis, campanhas e séries pensadas como narrativa: cada peça muda de função e composição sem perder reconhecimento."',
'"home.service3Text": "Edição, ritmo, motion, transições e sound design alinhados à identidade visual e ao objetivo de retenção."':'"home.service3Text": "Edição, ritmo, kinetic type, transições e sound design para transformar identidade estática em linguagem de movimento."',
'"home.service4Text": "3D, prototipagem, automação criativa e ferramentas emergentes integradas ao processo para ampliar possibilidades sem sacrificar direção."':'"home.service4Text": "3D, protótipos, automações e tecnologia de ponta usados como instrumentos de criação — quando ampliam a ideia, não para substituir direção."',
'"home.processTitle": "Menos improviso<br>Mais intenção"':'"home.processTitle": "Clareza primeiro<br>Execução depois"',
'"home.process2": "Referências"':'"home.process2": "Direção"',
'"home.process1Text": "Entender marca, público, contexto, restrições e objetivo comercial."':'"home.process1Text": "Problema, público, restrições e objetivo definidos antes de qualquer escolha visual."',
'"home.process2Text": "Pesquisar o nicho, decompor referências e separar linguagem útil de ornamento."':'"home.process2Text": "Referências viram critérios; definimos o território visual e, tão importante quanto, o que evitar."',
'"home.process3Text": "Definir hierarquia, tipografia, paleta, fotografia, composição e regras de variação."':'"home.process3Text": "Hierarquia, tipografia, cor, fotografia, movimento e regras de variação passam a funcionar como um conjunto."',
'"home.process4Text": "Criar as peças com funções diferentes dentro do mesmo universo visual."':'"home.process4Text": "As peças assumem funções diferentes sem sair do mesmo universo visual."',
'"home.process5": "Revisão"':'"home.process5": "Refinamento"',
'"home.process5Text": "Eliminar ruído, repetição, microtexto e qualquer decisão que pareça gratuita."':'"home.process5Text": "Cortamos ruído, repetição e decisões gratuitas antes da entrega."',
'"home.aboutKicker": "ABOUT / HOW I THINK"':'"home.aboutKicker": "ABOUT / POINT OF VIEW"',
'"home.aboutTitle": "Build the language<br>before the pieces"':'"home.aboutTitle": "Direction turns references<br>into identity"',
'"home.aboutLead": "I work where art direction, social, video and advanced technology meet. Instead of accumulating isolated pieces, I build visual systems that preserve identity, vary with intent and grow with the brand."':'"home.aboutLead": "My work begins before the first asset: with the brand, the market and what needs to remain in memory. Art direction, social, video and technology come together to build a recognisable presence that can evolve."',
'"home.aboutBody": "I start by understanding context, positioning and what needs to be perceived. References become criteria; typography, image, colour, composition and motion each get a clear role. The result should feel proprietary — not like a collection of trends."':'"home.aboutBody": "I do not use references as shortcuts. I use them as raw material for original rules of composition, image, typography, rhythm and motion, so every output belongs to the same world without becoming the same template."',
'"home.servicesKicker": "SERVICES / FROM CONCEPT TO DELIVERY"':'"home.servicesKicker": "SERVICES / WHERE I ENTER THE PROJECT"',
'"home.servicesTitle": "Visual strategy<br>turned into a system"':'"home.servicesTitle": "From intent<br>to visual impact"',
'"home.service1Text": "Visual positioning, concept, references, photographic direction, typography, palette and language rules that give the brand a recognisable signature."':'"home.service1Text": "Concept, photographic direction, typography, palette and composition rules brought together in a direction that can sustain both brand and campaign."',
'"home.service2Text": "Carousels, campaigns and content ecosystems designed as a series: every piece has a role without repeating the same template."':'"home.service2Text": "Carousels, campaigns and series designed as narrative: every piece changes role and composition without losing recognition."',
'"home.service3Text": "Editing, rhythm, motion, transitions and sound design aligned with the visual identity and retention goals."':'"home.service3Text": "Editing, rhythm, kinetic type, transitions and sound design that turn static identity into a language of movement."',
'"home.service4Text": "3D, prototyping, creative automation and emerging tools integrated into the process to expand possibilities without sacrificing direction."':'"home.service4Text": "3D, prototypes, automation and advanced technology used as creative instruments when they strengthen the idea — never as a substitute for direction."',
'"home.processTitle": "Less improvisation<br>More intent"':'"home.processTitle": "Clarity first<br>Execution second"',
'"home.process2": "References"':'"home.process2": "Direction"',
'"home.process1Text": "Understand the brand, audience, context, constraints and commercial objective."':'"home.process1Text": "Define the problem, audience, constraints and objective before making visual choices."',
'"home.process2Text": "Research the niche, deconstruct references and separate useful language from decoration."':'"home.process2Text": "References become criteria; we define the visual territory and, just as importantly, what to avoid."',
'"home.process3Text": "Define hierarchy, typography, palette, photography, composition and variation rules."':'"home.process3Text": "Hierarchy, typography, colour, photography, motion and variation rules begin to work as one system."',
'"home.process4Text": "Create pieces with different roles inside the same visual universe."':'"home.process4Text": "Assets take on different roles without leaving the same visual universe."',
'"home.process5": "Review"':'"home.process5": "Refinement"',
'"home.process5Text": "Remove noise, repetition, microcopy and any decision that feels gratuitous."':'"home.process5Text": "We remove noise, repetition and gratuitous decisions before delivery."',
'"home.aboutKicker": "SOBRE MÍ / CÓMO PIENSO"':'"home.aboutKicker": "SOBRE MÍ / PUNTO DE VISTA"',
'"home.aboutTitle": "Construyo lenguaje<br>antes que piezas"':'"home.aboutTitle": "La dirección transforma referencias<br>en identidad"',
'"home.aboutLead": "Trabajo en la intersección entre dirección de arte, social, vídeo y tecnología avanzada. En lugar de acumular piezas aisladas, construyo sistemas visuales capaces de conservar identidad, variar con intención y crecer con la marca."':'"home.aboutLead": "Mi trabajo empieza antes de la primera pieza: en la marca, el mercado y aquello que debe quedar en la memoria. Dirección de arte, social, vídeo y tecnología se unen para construir una presencia reconocible y capaz de evolucionar."',
'"home.aboutBody": "Empiezo entendiendo contexto, posicionamiento y lo que debe percibirse. Las referencias se convierten en criterios; tipografía, imagen, color, composición y movimiento pasan a cumplir funciones claras. El resultado debe sentirse propio — no como una colección de tendencias."':'"home.aboutBody": "No uso referencias como atajo. Las uso como materia prima para crear reglas propias de composición, imagen, tipografía, ritmo y movimiento, de modo que cada entrega pertenezca al mismo universo sin convertirse en la misma plantilla."',
'"home.servicesKicker": "SERVICIOS / DEL CONCEPTO A LA ENTREGA"':'"home.servicesKicker": "SERVICIOS / DÓNDE ENTRO EN EL PROYECTO"',
'"home.servicesTitle": "Estrategia visual<br>convertida en sistema"':'"home.servicesTitle": "De la intención<br>al impacto visual"',
'"home.service1Text": "Posicionamiento visual, concepto, referencias, dirección fotográfica, tipografía, paleta y reglas de lenguaje para dar a la marca una firma reconocible."':'"home.service1Text": "Concepto, dirección fotográfica, tipografía, paleta y reglas de composición reunidas en una dirección capaz de sostener marca y campaña."',
'"home.service2Text": "Carruseles, campañas y ecosistemas de contenido pensados en serie: cada pieza cumple una función sin repetir la misma plantilla."':'"home.service2Text": "Carruseles, campañas y series pensadas como narrativa: cada pieza cambia de función y composición sin perder reconocimiento."',
'"home.service3Text": "Edición, ritmo, motion, transiciones y sound design alineados con la identidad visual y los objetivos de retención."':'"home.service3Text": "Edición, ritmo, kinetic type, transiciones y sound design para convertir una identidad estática en lenguaje de movimiento."',
'"home.service4Text": "3D, prototipado, automatización creativa y herramientas emergentes integradas al proceso para ampliar posibilidades sin sacrificar dirección."':'"home.service4Text": "3D, prototipos, automatizaciones y tecnología avanzada usados como instrumentos creativos cuando amplían la idea — nunca para sustituir dirección."',
'"home.processTitle": "Menos improvisación<br>Más intención"':'"home.processTitle": "Claridad primero<br>Ejecución después"',
'"home.process2": "Referencias"':'"home.process2": "Dirección"',
'"home.process1Text": "Entender marca, audiencia, contexto, restricciones y objetivo comercial."':'"home.process1Text": "Definir problema, audiencia, restricciones y objetivo antes de tomar decisiones visuales."',
'"home.process2Text": "Investigar el nicho, descomponer referencias y separar lenguaje útil de ornamento."':'"home.process2Text": "Las referencias se convierten en criterios; definimos el territorio visual y, con la misma importancia, qué evitar."',
'"home.process3Text": "Definir jerarquía, tipografía, paleta, fotografía, composición y reglas de variación."':'"home.process3Text": "Jerarquía, tipografía, color, fotografía, movimiento y reglas de variación empiezan a funcionar como un conjunto."',
'"home.process4Text": "Crear piezas con funciones diferentes dentro del mismo universo visual."':'"home.process4Text": "Las piezas asumen funciones distintas sin salir del mismo universo visual."',
'"home.process5": "Revisión"':'"home.process5": "Refinamiento"',
'"home.process5Text": "Eliminar ruido, repetición, microtexto y decisiones que se sientan gratuitas."':'"home.process5Text": "Eliminamos ruido, repetición y decisiones gratuitas antes de la entrega."'
}
for old,new in repls.items():
    s=s.replace(old,new)
s=s.replace('"home.servicesTitle": "Da intenção<br>ao impacto visual",','"home.servicesTitle": "Da intenção<br>ao impacto visual",\n      "home.servicesIntro": "Entro onde o projeto precisa de direção: da linguagem inicial à expansão de uma campanha em formatos, canais e ritmos diferentes.",')
s=s.replace('"home.servicesTitle": "From intent<br>to visual impact",','"home.servicesTitle": "From intent<br>to visual impact",\n      "home.servicesIntro": "I enter where the project needs direction: from defining a visual language to expanding a campaign across formats, channels and different rhythms.",')
s=s.replace('"home.servicesTitle": "De la intención<br>al impacto visual",','"home.servicesTitle": "De la intención<br>al impacto visual",\n      "home.servicesIntro": "Entro donde el proyecto necesita dirección: desde definir el lenguaje hasta expandir una campaña en formatos, canales y ritmos distintos.",')
p.write_text(s,encoding='utf-8')
