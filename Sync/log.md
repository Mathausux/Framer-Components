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
| Claude | Adicionar seletor de elemento do Canvas (ControlType.ComponentInstance) como forma alternativa de conectar ao CMS exposto no canvas | `Framer Codes Component/AYVU/CMSGallerySlideshow.tsx`, `Sync/log.md` | concluido |
| Claude | Corrigir leitura do elemento do Canvas: ref.current podia nao estar pronto no primeiro efeito e nunca reativar; adicionado polling ate anexar o observer | `Framer Codes Component/AYVU/CMSGallerySlideshow.tsx`, `Sync/log.md` | concluido |
| Claude | Corrigir abordagem do seletor de Canvas com base em componente de referencia (CMSSlideshow): ControlType.ComponentInstance entrega React.ReactNode para renderizar, nao um ref externo; prop renomeada para collectionSource e renderizada internamente (invisivel) para leitura via DOM | `Framer Codes Component/AYVU/CMSGallerySlideshow.tsx`, `Sync/log.md` | concluido |
| Claude | Adicionar paridade Canvas/Preview: RenderTarget.canvas + prop "Slide (Canvas)" para escolher manualmente o slide exibido no editor enquanto dados reais do CMS carregam | `Framer Codes Component/AYVU/CMSGallerySlideshow.tsx`, `Sync/log.md` | concluido |
| Claude | Expandir setas, indicadores e contador para grupos de props configuraveis (posicao, tamanho, cores, blur, contorno, layout separado/agrupado), no padrao do componente de referencia | `Framer Codes Component/AYVU/CMSGallerySlideshow.tsx`, `Sync/log.md` | concluido |
| Claude | Adicionar suporte a video (CMS e manual): extracao de <video> do elemento conectado no Canvas, prop "Itens" manual com tipo imagem/video por item, e opcao "Aguardar video" para avancar so quando o video termina | `Framer Codes Component/AYVU/CMSGallerySlideshow.tsx`, `Sync/log.md` | concluido |
| Claude | Corrigir arrasto: slide vizinho (proximo/anterior) agora acompanha o dedo em tempo real durante o drag, eliminando o fundo preto que aparecia atras do slide atual | `Framer Codes Component/AYVU/CMSGallerySlideshow.tsx`, `Sync/log.md` | concluido |

## Decisoes

- `Sync/sync` deve permanecer leve para economizar contexto e creditos.
- Regras completas ficam em `Sync/rules.md`.
- Historico e decisoes antigas ficam em `Sync/log.md`.
- A pasta `Skills` sera usada como local compartilhado para armazenar skills instaladas ou criadas para o repositorio.
- A pasta `Sync` sera usada para guardar arquivos de coordenacao entre agentes.
- Componentes Framer devem ser separados por empresa dentro de `Framer Codes Component/`.