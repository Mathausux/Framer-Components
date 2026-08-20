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

## 2026-08-20

| Agente | Tarefa | Arquivos | Status |
| --- | --- | --- | --- |
| Claude | Criar componente Scroll Mask (efeito inspirado em reactbits.dev/scroll-mask, máscara de degradê nas bordas que some no início/fim do scroll) | `Framer Codes Component/AYVU/ScrollMask.tsx`, `Sync/log.md` | concluido |
| Claude | Registrar regra de merge automatico de PRs concluidas | `Sync/rules.md`, `Sync/sync` | concluido |
| Claude | Corrigir Scroll Mask para o efeito real do React Bits Pro (rolagem abre mascara revelando imagem em 6 formatos: circulo, losango, cortina horizontal/vertical, diagonal, persianas) via framer-motion useScroll | `Framer Codes Component/AYVU/ScrollMask.tsx`, `Sync/log.md` | concluido |
| Claude | Adicionar comportamento sticky ao Scroll Mask (secao fica presa no topo durante o scroll e solta ao revelar a imagem por completo) | `Framer Codes Component/AYVU/ScrollMask.tsx`, `Sync/log.md` | concluido |
| Claude | Adicionar tamanho inicial/final configuraveis da forma e suporte a SVG personalizado como mascara no Scroll Mask | `Framer Codes Component/AYVU/ScrollMask.tsx`, `Sync/log.md` | concluido |
| Claude | Simplificar Scroll Mask: remover formas geometricas pre-definidas e seletor "Formato", manter apenas mascara via SVG importado usando ControlType.Image nativo do Framer | `Framer Codes Component/AYVU/ScrollMask.tsx`, `Sync/log.md` | concluido |
| Claude | Ajustar Tamanho final do Scroll Mask (max 500, padrao 300) para a mascara ultrapassar a silhueta do SVG e revelar a imagem por completo | `Framer Codes Component/AYVU/ScrollMask.tsx`, `Sync/log.md` | concluido |
| Claude | Corrigir prop "Forma (SVG)" do Scroll Mask de ControlType.Image (reprocessa/otimiza imagem, corrompe SVG bruto) para ControlType.File com allowedFileTypes svg (URL do arquivo original) | `Framer Codes Component/AYVU/ScrollMask.tsx`, `Sync/log.md` | concluido |
| Claude | Adicionar controle de Z-Index a secao sticky (SVG + imagem) do Scroll Mask | `Framer Codes Component/AYVU/ScrollMask.tsx`, `Sync/log.md` | concluido |
| Claude | Renderizar o SVG do Scroll Mask como elemento visivel separado (nao so mascara invisivel) com Z-Index proprio, independente do Z-Index geral da secao | `Framer Codes Component/AYVU/ScrollMask.tsx`, `Sync/log.md` | concluido |

## Decisoes

- `Sync/sync` deve permanecer leve para economizar contexto e creditos.
- Regras completas ficam em `Sync/rules.md`.
- Historico e decisoes antigas ficam em `Sync/log.md`.
- A pasta `Skills` sera usada como local compartilhado para armazenar skills instaladas ou criadas para o repositorio.
- A pasta `Sync` sera usada para guardar arquivos de coordenacao entre agentes.
- Componentes Framer devem ser separados por empresa dentro de `Framer Codes Component/`.