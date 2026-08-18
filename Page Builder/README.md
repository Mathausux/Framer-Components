# Page Builder

Editor visual estilo Framer, com projetos versionados no GitHub (1 repositório por projeto).

Este diretório contém o app do editor. Consulte `../Sync/log.md` para o histórico de fases já concluídas e `docs/PLANO.md` para o planejamento completo.

## Fase 0 — Fundação ✅

- Schema JSON que representa um projeto (páginas, árvore de nós, breakpoints, coleções, tokens de design).
- Esqueleto do editor em Next.js (App Router + TypeScript).
- Camada de integração com GitHub via Octokit: criar repositório do projeto, ler e salvar `project.json`.

## Fase 1 — Canvas MVP ✅

- Página `/projects/[repo]` que carrega o `project.json` e renderiza a primeira página do projeto no canvas.
- Seleção de blocos por clique, drag-and-drop simples via `@dnd-kit` (arrastar bloco da paleta para um frame, mover um bloco existente entre frames).
- Blocos suportados: frame, texto, imagem, botão.
- Alternância entre breakpoints (desktop/tablet/mobile) com cascata de estilos.
- Botão "Salvar" faz commit do `project.json` atualizado no repositório via `PUT /api/projects/[repo]`.

## Fase 2 — Estilos visuais ✅

- `StyleEditor` no Inspector: campos visuais por breakpoint para layout (direção, alinhamento, espaço entre itens — só em containers), espaçamento (padding), dimensões (largura/altura), tipografia (tamanho, peso, cor, alinhamento — em texto/botão) e aparência (cor de fundo, cantos arredondados).
- Deixar um campo vazio remove a propriedade do breakpoint ativo (herda do breakpoint maior) em vez de gravar um valor vazio.
- Editor JSON bruto continua disponível, colapsado atrás de "Avançado: editar estilos como JSON", para qualquer propriedade CSS ainda sem campo visual.

## Fase 3 — Component Library ✅

- Os componentes de `Framer Codes Component/` (ex: `AYVU/CMSGallerySlideshow`) renderizam **de verdade** dentro do canvas — não é um placeholder. Isso é possível graças a um shim do pacote `framer` (`src/lib/framerCanvasShim.ts`, só existe de verdade dentro do editor do Framer) e a um wrapper estático (`src/components/library/`) que reexporta o componente original.
- `src/lib/componentLibrary.ts` é o registry: id, nome, empresa, descrição, props padrão e um subconjunto curado de props editáveis (equivalente ao `propertyControls` do Framer) para cada componente disponível.
- A Paleta ganhou a seção "Componentes"; soltar um no canvas cria um nó `component-ref` com as props padrão do registry, editáveis no Inspector.
- Para adicionar um novo componente: crie um wrapper estático em `src/components/library/` e uma entrada em `componentLibrary.ts` (não há varredura dinâmica da pasta — mantém a resolução de módulos do webpack simples e verificável).

## Fase 4 — CMS + Animações ✅ (atual)

- **Coleções (CMS)**: botão "Coleções" no header do editor abre um modal (`CollectionsManager.tsx`) para criar coleções, adicionar campos tipados (texto, texto longo, número, booleano, data, imagem, link) e editar itens (linhas de dados) numa tabela.
- Bloco "Coleção CMS" na Paleta: ao soltar no canvas, cria um nó `cms-collection` com um template padrão (frame + texto vinculado ao primeiro campo). Se o projeto ainda não tiver nenhuma coleção, uma é criada automaticamente com 2 itens de exemplo, pra já ver algo funcionando.
- O template de uma `cms-collection` repete uma vez por item da coleção no canvas (só a primeira repetição é interativa/arrastável — as demais são um preview visual, já que compartilham o mesmo nó-template).
- Nós texto/imagem dentro do template ganham, no Inspector, um seletor "Vincular a campo da coleção" — trocando conteúdo fixo por dado vindo da coleção.
- **Animações**: uma animação por nó (`AnimationEditor` no Inspector — disparo onLoad/onScroll/onHover/onTap, efeito fade/slide/escala, duração e atraso), renderizada ao vivo no canvas via Framer Motion (`src/lib/motion.ts`), não é só metadado salvo.

Fora de escopo nestas fases (fases futuras): múltiplas páginas na UI, reordenação fina (posição exata) de blocos, timeline com múltiplas animações por nó, exportação de código, deploy automático.

## Setup

```bash
cd "Page Builder/app"
npm install
cp .env.example .env.local
# preencha GITHUB_TOKEN (PAT com escopo "repo") e GITHUB_OWNER no .env.local
npm run dev
```

Abra `http://localhost:3000`. A tela inicial lista os projetos (repositórios que contêm um `project.json` na raiz, marcados com o topic `page-builder-project`) e permite criar um novo projeto, o que cria um repositório novo no GitHub com um `project.json` inicial.

### Testar sem GitHub configurado (modo local)

Se `GITHUB_TOKEN`/`GITHUB_OWNER` não estiverem definidos, o app usa
automaticamente um driver de armazenamento local (`src/lib/localStore.ts`),
salvando os projetos em `app/.local-projects/` (ignorado pelo git). Serve só
para rodar e testar o editor rapidamente — a tela inicial mostra um aviso
quando esse modo está ativo. Para uso real, configure o `.env.local`.

## Estrutura

```
Page Builder/
├── README.md
├── docs/
│   └── PLANO.md            # planejamento completo por fases
├── schema/
│   └── project.schema.json # JSON Schema do modelo de dados de um projeto
└── app/                     # aplicação Next.js do editor
    ├── src/
    │   ├── app/
    │   │   ├── page.tsx                    # lista/criação de projetos
    │   │   ├── projects/[repo]/page.tsx    # editor visual (canvas + paleta + inspector)
    │   │   └── api/
    │   │       ├── config/route.ts         # GET: qual driver de storage está ativo
    │   │       └── projects/
    │   │           ├── route.ts            # GET (listar) / POST (criar)
    │   │           └── [repo]/route.ts      # GET (ler) / PUT (salvar) project.json
    │   ├── components/
    │   │   ├── Canvas.tsx             # renderiza a árvore, seleção, repetição de cms-collection e animações
    │   │   ├── Palette.tsx            # blocos arrastáveis (frame, texto, imagem, botão, coleção, componentes)
    │   │   ├── Inspector.tsx          # edição de nome/props/estilos/animação/binding do bloco selecionado
    │   │   ├── StyleEditor.tsx        # campos visuais de estilo por breakpoint
    │   │   ├── CollectionsManager.tsx # modal para gerenciar coleções (CMS)
    │   │   └── library/               # wrappers estáticos dos componentes de Framer Codes Component/
    │   └── lib/
    │       ├── schema.ts             # tipos TypeScript do modelo de dados
    │       ├── tree.ts               # operações imutáveis sobre a árvore de nós (inclui findAncestors)
    │       ├── nodeRenderer.ts       # resolução de estilos por breakpoint + defaults visuais
    │       ├── collections.ts        # operações imutáveis sobre coleções/campos/itens
    │       ├── motion.ts             # config de Animation -> props do framer-motion
    │       ├── componentLibrary.ts   # registry dos componentes disponíveis na Paleta
    │       ├── framerCanvasShim.ts   # shim do pacote "framer" (addPropertyControls/ControlType)
    │       ├── store.ts              # escolhe o driver de storage (github ou local)
    │       ├── github.ts             # driver de storage via GitHub (Octokit)
    │       ├── localStore.ts         # driver de storage local em disco (dev/teste)
    │       └── projectTemplate.ts    # project.json inicial de um projeto novo
    ├── next.config.mjs   # alias webpack "framer" -> shim + resolve.modules p/ Framer Codes Component/
    ├── package.json
    └── tsconfig.json
```

## Próxima fase (Fase 5)

Exportação dupla: gerador de código React/Framer a partir do `project.json`, e gerador de site Next.js estático publicável (com deploy automático).
