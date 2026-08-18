# log

Historico de sincronizacao entre Codex, Claude e outros agentes.

## 2026-08-11

| Agente | Tarefa | Arquivos | Status |
| --- | --- | --- | --- |
| Codex | Criar arquivo de sincronizacao | `sync` | concluido |
| Codex | Criar pasta para instalacao de skills | `Skills/.gitkeep`, `sync` | concluido |
| Codex | Mover sync para pasta dedicada e adicionar regras Framer | `Sync/sync`, `sync` | concluido |
| Codex | Criar estrutura de empresas para componentes Framer | `Framer Codes Component/AYVU/.gitkeep`, `Framer Codes Component/COLLATERAL PARTNERS/.gitkeep`, `Framer Codes Component/MEMP/.gitkeep`, `Framer Codes Component/FRAMER SKILLS/.gitkeep`, `Sync/sync` | concluido |
| Codex | Adicionar regra zero de leitura obrigatoria do sync | `Sync/sync` | concluido |
| Codex | Dividir sync em arquivo leve, regras e historico | `Sync/sync`, `Sync/rules.md`, `Sync/log.md` | concluido |
| Codex | Instalar skill `framer-motion-animator` autorizada por `skillinstall` | `Skills/framer-motion-animator/SKILL.md` | concluido |
| Codex | Instalar skill `caveman` autorizada por `skillinstall` | `Skills/caveman/README.md`, `Skills/caveman/SKILL.md` | concluido |

## 2026-08-13

| Agente | Tarefa | Arquivos | Status |
| --- | --- | --- | --- |
| Claude | Criar componente CMS Gallery Slideshow (conecta a Collection via seletor de campo Gallery) | `Framer Codes Component/AYVU/CMSGallerySlideshow.tsx`, `Sync/log.md` | concluido |

## 2026-08-18

| Agente | Tarefa | Arquivos | Status |
| --- | --- | --- | --- |
| Claude | Planejar Page Builder estilo Framer por fases (armazenamento em 1 repo GitHub por projeto) | conversa (planejamento) | concluido |
| Claude | Fase 0 do Page Builder: schema JSON do projeto, esqueleto Next.js do editor, integracao GitHub (Octokit) para criar/ler/salvar project.json | `Page Builder/README.md`, `Page Builder/docs/PLANO.md`, `Page Builder/schema/project.schema.json`, `Page Builder/app/**` | concluido |
| Claude | Fase 1 do Page Builder: canvas MVP com selecao, drag-and-drop (@dnd-kit), paleta de blocos, inspector de props/estilos e pagina de editor por projeto que salva via PUT | `Page Builder/app/src/lib/tree.ts`, `Page Builder/app/src/lib/nodeRenderer.ts`, `Page Builder/app/src/components/Canvas.tsx`, `Page Builder/app/src/components/Palette.tsx`, `Page Builder/app/src/components/Inspector.tsx`, `Page Builder/app/src/app/projects/[repo]/page.tsx`, `Page Builder/README.md`, `Page Builder/docs/PLANO.md` | concluido |
| Claude | Driver de storage local (fallback sem GITHUB_TOKEN) para rodar/testar o editor end-to-end no navegador; testado com Playwright headless. Corrigidos 2 bugs reais encontrados no teste: (1) DndContext do Canvas nao envolvia a Palette, entao arrastar bloco da paleta para o canvas nao funcionava; (2) useDraggable sem activationConstraint fazia o dnd-kit interceptar todo pointerdown e o evento de click nunca disparava, quebrando a selecao por clique | `Page Builder/app/src/lib/store.ts`, `Page Builder/app/src/lib/localStore.ts`, `Page Builder/app/src/app/api/config/route.ts`, `Page Builder/app/src/app/api/projects/route.ts`, `Page Builder/app/src/app/api/projects/[repo]/route.ts`, `Page Builder/app/src/components/Canvas.tsx`, `Page Builder/app/src/app/projects/[repo]/page.tsx`, `Page Builder/app/src/app/page.tsx`, `Page Builder/README.md` | concluido |
| Claude | Fase 2 do Page Builder: StyleEditor visual no Inspector (layout, espacamento, dimensoes, tipografia, aparencia) por breakpoint, com editor JSON avancado colapsavel como escape hatch; testado end-to-end com Playwright (troca de breakpoint, edicao visual, persistencia no project.json) | `Page Builder/app/src/components/StyleEditor.tsx`, `Page Builder/app/src/components/Inspector.tsx`, `Page Builder/README.md`, `Page Builder/docs/PLANO.md` | concluido |
| Claude | Fase 3 do Page Builder: componentes de `Framer Codes Component/` renderizam de verdade no canvas (nao placeholder), via shim do pacote "framer" (addPropertyControls/ControlType, so existe no runtime do editor do Framer) + wrapper estatico + registry com props editaveis no Inspector; Paleta ganhou secao Componentes. Corrigidos 2 ajustes de tipagem no CMSGallerySlideshow.tsx (params implicitos any) para passar no typecheck estrito do app; testado end-to-end com Playwright (drag do componente, imagens reais renderizando, prop showCounter, persistencia no project.json) | `Page Builder/app/src/lib/framerCanvasShim.ts`, `Page Builder/app/src/lib/componentLibrary.ts`, `Page Builder/app/src/components/library/AyvuCmsGallerySlideshow.tsx`, `Page Builder/app/src/components/Canvas.tsx`, `Page Builder/app/src/components/Palette.tsx`, `Page Builder/app/src/components/Inspector.tsx`, `Page Builder/app/src/app/projects/[repo]/page.tsx`, `Page Builder/app/next.config.mjs`, `Page Builder/app/tsconfig.json`, `Framer Codes Component/AYVU/CMSGallerySlideshow.tsx`, `Page Builder/README.md`, `Page Builder/docs/PLANO.md` | concluido |
| Claude | Fase 4 do Page Builder: CMS (coleções com campos tipados e itens, modal CollectionsManager, bloco cms-collection na paleta que repete um template por item da coleção com binding de campo por no) e Animacoes (uma animacao por no - onLoad/onScroll/onHover/onTap, fade/slide/escala - editavel no Inspector e renderizada ao vivo via framer-motion). Testado end-to-end com Playwright: drop do bloco Colecao CMS auto-cria colecao inicial com 2 itens, repeticao aparece no canvas, binding de campo funciona no Inspector, animacao configurada e persistencia correta no project.json | `Page Builder/app/src/lib/collections.ts`, `Page Builder/app/src/lib/motion.ts`, `Page Builder/app/src/lib/tree.ts`, `Page Builder/app/src/components/CollectionsManager.tsx`, `Page Builder/app/src/components/Canvas.tsx`, `Page Builder/app/src/components/Palette.tsx`, `Page Builder/app/src/components/Inspector.tsx`, `Page Builder/app/src/app/projects/[repo]/page.tsx`, `Page Builder/README.md`, `Page Builder/docs/PLANO.md` | concluido |

## Decisoes

- `Page Builder/` concentra o editor visual estilo Framer, desenvolvido por fases (ver `Page Builder/docs/PLANO.md`). Cada projeto criado pelo editor vira um repositorio GitHub proprio.

- `Sync/sync` deve permanecer leve para economizar contexto e creditos.
- Regras completas ficam em `Sync/rules.md`.
- Historico e decisoes antigas ficam em `Sync/log.md`.
- A pasta `Skills` sera usada como local compartilhado para armazenar skills instaladas ou criadas para o repositorio.
- A pasta `Sync` sera usada para guardar arquivos de coordenacao entre agentes.
- Componentes Framer devem ser separados por empresa dentro de `Framer Codes Component/`.