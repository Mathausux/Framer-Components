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

## Decisoes

- `Sync/sync` deve permanecer leve para economizar contexto e creditos.
- Regras completas ficam em `Sync/rules.md`.
- Historico e decisoes antigas ficam em `Sync/log.md`.
- A pasta `Skills` sera usada como local compartilhado para armazenar skills instaladas ou criadas para o repositorio.
- A pasta `Sync` sera usada para guardar arquivos de coordenacao entre agentes.
- Componentes Framer devem ser separados por empresa dentro de `Framer Codes Component/`.