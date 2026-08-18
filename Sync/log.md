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

## Decisoes

- `Page Builder/` concentra o editor visual estilo Framer, desenvolvido por fases (ver `Page Builder/docs/PLANO.md`). Cada projeto criado pelo editor vira um repositorio GitHub proprio.

- `Sync/sync` deve permanecer leve para economizar contexto e creditos.
- Regras completas ficam em `Sync/rules.md`.
- Historico e decisoes antigas ficam em `Sync/log.md`.
- A pasta `Skills` sera usada como local compartilhado para armazenar skills instaladas ou criadas para o repositorio.
- A pasta `Sync` sera usada para guardar arquivos de coordenacao entre agentes.
- Componentes Framer devem ser separados por empresa dentro de `Framer Codes Component/`.