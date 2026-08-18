# Page Builder

Editor visual estilo Framer, com projetos versionados no GitHub (1 repositório por projeto).

Este diretório contém o app do editor. Consulte `../Sync/log.md` para o histórico de fases já concluídas e `docs/PLANO.md` para o planejamento completo.

## Fase 0 — Fundação (atual)

Escopo desta fase:
- Schema JSON que representa um projeto (páginas, árvore de nós, breakpoints, coleções, tokens de design).
- Esqueleto do editor em Next.js (App Router + TypeScript).
- Camada de integração com GitHub via Octokit: criar repositório do projeto, ler e salvar `project.json`.

Fora de escopo nesta fase (fases futuras): canvas de drag-and-drop, renderização visual, exportação de código, deploy automático.

## Setup

```bash
cd "Page Builder/app"
npm install
cp .env.example .env.local
# preencha GITHUB_TOKEN (PAT com escopo "repo") e GITHUB_OWNER no .env.local
npm run dev
```

Abra `http://localhost:3000`. A tela inicial lista os projetos (repositórios que contêm um `project.json` na raiz, marcados com o topic `page-builder-project`) e permite criar um novo projeto, o que cria um repositório novo no GitHub com um `project.json` inicial.

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
    │   │   └── api/
    │   │       └── projects/
    │   │           ├── route.ts            # GET (listar) / POST (criar)
    │   │           └── [repo]/route.ts      # GET (ler) / PUT (salvar) project.json
    │   └── lib/
    │       ├── schema.ts     # tipos TypeScript do modelo de dados
    │       ├── github.ts     # integração com GitHub (Octokit)
    │       └── projectTemplate.ts # project.json inicial de um projeto novo
    ├── package.json
    └── tsconfig.json
```

## Próxima fase (Fase 1)

Canvas MVP: renderizar a árvore do `project.json` visualmente, permitir seleção e edição básica de blocos (frame, texto, imagem, botão), com drag-and-drop simples.
