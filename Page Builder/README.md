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

## Fase 2 — Estilos visuais ✅ (atual)

- `StyleEditor` no Inspector: campos visuais por breakpoint para layout (direção, alinhamento, espaço entre itens — só em containers), espaçamento (padding), dimensões (largura/altura), tipografia (tamanho, peso, cor, alinhamento — em texto/botão) e aparência (cor de fundo, cantos arredondados).
- Deixar um campo vazio remove a propriedade do breakpoint ativo (herda do breakpoint maior) em vez de gravar um valor vazio.
- Editor JSON bruto continua disponível, colapsado atrás de "Avançado: editar estilos como JSON", para qualquer propriedade CSS ainda sem campo visual.

Fora de escopo nestas fases (fases futuras): múltiplas páginas na UI, reordenação fina (posição exata) de blocos, animações, CMS, exportação de código, deploy automático.

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
    │   │   ├── Canvas.tsx      # renderiza a árvore e a seleção (drag-and-drop via DndContext do pai)
    │   │   ├── Palette.tsx     # blocos arrastáveis (frame, texto, imagem, botão)
    │   │   ├── Inspector.tsx   # edição de nome/props/estilos do bloco selecionado
    │   │   └── StyleEditor.tsx # campos visuais de estilo por breakpoint
    │   └── lib/
    │       ├── schema.ts       # tipos TypeScript do modelo de dados
    │       ├── tree.ts         # operações imutáveis sobre a árvore de nós
    │       ├── nodeRenderer.ts # resolução de estilos por breakpoint + defaults visuais
    │       ├── store.ts        # escolhe o driver de storage (github ou local)
    │       ├── github.ts       # driver de storage via GitHub (Octokit)
    │       ├── localStore.ts   # driver de storage local em disco (dev/teste)
    │       └── projectTemplate.ts # project.json inicial de um projeto novo
    ├── package.json
    └── tsconfig.json
```

## Próxima fase (Fase 3)

Component Library: integrar os componentes já existentes em `Framer Codes Component/` como blocos arrastáveis no canvas (tipo `component-ref`).
