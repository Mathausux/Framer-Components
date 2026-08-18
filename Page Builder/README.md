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

## Fase 4 — CMS + Animações ✅

- **Coleções (CMS)**: botão "Coleções" no header do editor abre um modal (`CollectionsManager.tsx`) para criar coleções, adicionar campos tipados (texto, texto longo, número, booleano, data, imagem, link) e editar itens (linhas de dados) numa tabela.
- Bloco "Coleção CMS" na Paleta: ao soltar no canvas, cria um nó `cms-collection` com um template padrão (frame + texto vinculado ao primeiro campo). Se o projeto ainda não tiver nenhuma coleção, uma é criada automaticamente com 2 itens de exemplo, pra já ver algo funcionando.
- O template de uma `cms-collection` repete uma vez por item da coleção no canvas (só a primeira repetição é interativa/arrastável — as demais são um preview visual, já que compartilham o mesmo nó-template).
- Nós texto/imagem dentro do template ganham, no Inspector, um seletor "Vincular a campo da coleção" — trocando conteúdo fixo por dado vindo da coleção.
- **Animações**: uma animação por nó (`AnimationEditor` no Inspector — disparo onLoad/onScroll/onHover/onTap, efeito fade/slide/escala, duração e atraso), renderizada ao vivo no canvas via Framer Motion (`src/lib/motion.ts`), não é só metadado salvo.

## Fase 5 — Exportação dupla ✅

- Botão "Exportar" no header do editor gera código a partir do `project.json` e commita no próprio repositório do projeto (salva o projeto primeiro, pra garantir que exporta o estado atual):
  - `export/site/` — site Next.js completo e publicável: uma rota (App Router) por página, CSS Module por página com media queries por breakpoint, `package.json`/`next.config.mjs`/`tsconfig.json` prontos pra `npm install && npm run dev` ou deploy.
  - `export/component/` — um `.tsx` autocontido por página, com estilos inline (só o breakpoint mais largo, já que um arquivo único não faz media query), pra colar como Custom Code Component no Framer ou importar em outro projeto React.
- Animações viram `motion.div`/`motion.button` de verdade no código gerado (`src/lib/motion.ts` é reaproveitado tal qual do canvas). Itens de `cms-collection` são "desenrolados" em blocos JSX estáticos (um por item), não um `.map()` em runtime.
- Testado gerando, buildando (`next build`) e rodando (`next start`) o site exportado de forma independente — funciona de verdade, não é só código de exemplo.
- Limitação conhecida: componentes da biblioteca (`component-ref`) ainda não são copiados automaticamente — viram um comentário `{/* Componente ... */}` no lugar, indicando pra adicionar manualmente. Fica pra uma iteração futura.

## Fase 6 — Persistência GitHub completa ✅ (atual)

- **Autosave**: salva ~2s após a última mudança, sem precisar clicar em "Salvar" — indicador de status ("Salvando…"/"Salvo automaticamente") no header. O botão "Salvar" manual continua ali para salvar na hora.
- **Histórico de versões**: botão "Histórico" abre um modal listando versões salvas (no GitHub, é o histórico real de commits do `project.json`; no modo local, snapshots em disco, últimos 20) com "Restaurar" — que grava o conteúdo daquela versão como o estado atual (um novo salvamento/commit, sem reescrever histórico).
- **Publicar**: exporta o site atualizado e mostra um link real de "Deploy on Vercel" (`vercel.com/new/clone?repository-url=...&root-directory=export/site`) — sem precisar de nenhuma credencial de deploy. No modo local, explica que publicar requer o projeto configurado com GitHub.
- Dois bugs reais corrigidos durante o teste: rotas GET de versões precisavam de `export const dynamic = "force-dynamic"` (Next.js as trataria como estáticas por padrão, servindo respostas desatualizadas); e qualquer erro de ação (salvar/exportar/publicar) derrubava a tela inteira do editor por reusar o mesmo estado de erro do carregamento inicial — agora é um banner dispensável (`actionError`), separado do erro de carregamento.

Fora de escopo (não planejado): múltiplas páginas na UI, reordenação fina (posição exata) de blocos, timeline com múltiplas animações por nó, exportação de componentes da biblioteca, deploy automático de verdade (o "Publicar" gera o link, não dispara o deploy).

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
    │   │           ├── route.ts                          # GET (listar) / POST (criar)
    │   │           └── [repo]/
    │   │               ├── route.ts                      # GET (ler) / PUT (salvar) project.json
    │   │               ├── export/route.ts                # POST: gera e grava export/site + export/component
    │   │               └── versions/
    │   │                   ├── route.ts                   # GET: lista o histórico de versões
    │   │                   └── [versionId]/route.ts        # GET: conteúdo de uma versão específica
    │   ├── components/
    │   │   ├── Canvas.tsx             # renderiza a árvore, seleção, repetição de cms-collection e animações
    │   │   ├── Palette.tsx            # blocos arrastáveis (frame, texto, imagem, botão, coleção, componentes)
    │   │   ├── Inspector.tsx          # edição de nome/props/estilos/animação/binding do bloco selecionado
    │   │   ├── StyleEditor.tsx        # campos visuais de estilo por breakpoint
    │   │   ├── CollectionsManager.tsx # modal para gerenciar coleções (CMS)
    │   │   ├── VersionHistory.tsx     # modal de histórico de versões + restaurar
    │   │   └── library/               # wrappers estáticos dos componentes de Framer Codes Component/
    │   └── lib/
    │       ├── schema.ts             # tipos TypeScript do modelo de dados
    │       ├── tree.ts               # operações imutáveis sobre a árvore de nós (inclui findAncestors)
    │       ├── nodeRenderer.ts       # resolução de estilos por breakpoint + defaults visuais
    │       ├── collections.ts        # operações imutáveis sobre coleções/campos/itens
    │       ├── motion.ts             # config de Animation -> props do framer-motion
    │       ├── codegen/
    │       │   ├── css.ts              # CSS Module (com media queries) a partir dos estilos de um nó
    │       │   ├── jsx.ts               # árvore de nós -> JSX (texto), modo css-module ou inline
    │       │   ├── exportSite.ts        # monta o site Next.js completo (export/site)
    │       │   └── exportComponent.ts   # monta os componentes de arquivo único (export/component)
    │       ├── componentLibrary.ts   # registry dos componentes disponíveis na Paleta
    │       ├── framerCanvasShim.ts   # shim do pacote "framer" (addPropertyControls/ControlType)
    │       ├── store.ts              # escolhe o driver de storage (github ou local); writeFiles + listVersions/getVersionContent
    │       ├── github.ts             # driver de storage via GitHub (Octokit)
    │       ├── localStore.ts         # driver de storage local em disco (dev/teste)
    │       └── projectTemplate.ts    # project.json inicial de um projeto novo
    ├── next.config.mjs   # alias webpack "framer" -> shim + resolve.modules p/ Framer Codes Component/
    ├── package.json
    └── tsconfig.json
```

## Todas as fases do plano original (0-6) estão concluídas

Ideias para continuar (não planejadas formalmente): múltiplas páginas navegáveis na UI do editor, reordenação fina de blocos por posição exata, exportação automática dos componentes da biblioteca, timeline com múltiplas animações por nó, deploy automatizado de verdade (hoje "Publicar" gera o link, o clique final é do usuário).
