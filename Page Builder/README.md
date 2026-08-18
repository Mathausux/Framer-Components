# Page Builder

Editor visual estilo Framer, com projetos versionados no GitHub (1 repositório por projeto).

Este diretório contém o app do editor. Consulte `../Sync/log.md` para o histórico de fases já concluídas e `docs/PLANO.md` para o planejamento completo.

## Fase 0 — Fundação ✅

- Schema JSON que representa um projeto (páginas, árvore de nós, breakpoints, coleções, tokens de design).
- Esqueleto do editor em Next.js (App Router + TypeScript).
- Camada de integração com GitHub via Octokit: criar repositório do projeto, ler e salvar `project.json`.

## Fase 1 — Canvas MVP ✅ (atual)

- Página `/projects/[repo]` que carrega o `project.json` e renderiza a primeira página do projeto no canvas.
- Seleção de blocos por clique, drag-and-drop simples via `@dnd-kit` (arrastar bloco da paleta para um frame, mover um bloco existente entre frames).
- Blocos suportados: frame, texto, imagem, botão.
- Inspector para editar nome, props (conteúdo, src, rótulo) e estilos (JSON) do bloco selecionado por breakpoint, com opção de excluir.
- Alternância entre breakpoints (desktop/tablet/mobile) com cascata de estilos.
- Botão "Salvar" faz commit do `project.json` atualizado no repositório via `PUT /api/projects/[repo]`.

Fora de escopo nesta fase (fases futuras): múltiplas páginas na UI, reordenação fina (posição exata) de blocos, animações, CMS, exportação de código, deploy automático.

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
    │   │   ├── Canvas.tsx     # renderiza a árvore e a seleção (drag-and-drop via DndContext do pai)
    │   │   ├── Palette.tsx    # blocos arrastáveis (frame, texto, imagem, botão)
    │   │   └── Inspector.tsx  # edição de nome/props/estilos do bloco selecionado
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

## Próxima fase (Fase 2)

Responsividade e estilos: editor visual de estilos (spacing, cor, tipografia) por breakpoint, substituindo a edição via JSON bruto do Inspector.
