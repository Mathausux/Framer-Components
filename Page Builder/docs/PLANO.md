# Plano — Page Builder

Editor visual estilo Framer, construído do zero, uso pessoal, com projetos versionados no GitHub (1 repositório por projeto). Saída dupla: componentes React/Framer + sites estáticos publicáveis.

## Arquitetura macro

```
Editor App (Next.js)
  Canvas (drag/drop, seleção, resize)
  Component Library (registry de blocos + componentes de Framer Codes Component/)
  Inspector (props, estilos, animações, breakpoints)
        |
  Project State = JSON tree (schema/project.schema.json)
        |
  GitHub Integration Layer (Octokit)
        |
  1 repositório por projeto
    /project.json
    /components/*.tsx
    /site/ (Next.js export)
        |
  Deploy opcional (Vercel / GitHub Pages)
```

## Fases

- **Fase 0 — Fundação** ✅ (`Page Builder/app`)
  - Schema JSON do projeto (`schema/project.schema.json` + `src/lib/schema.ts`).
  - Esqueleto Next.js do editor.
  - Integração GitHub (Octokit): criar repo, ler/salvar `project.json`.
- **Fase 1 — Canvas MVP** ✅ (`Page Builder/app/src/app/projects/[repo]`, `src/components/{Canvas,Palette,Inspector}.tsx`, `src/lib/tree.ts`)
  - Renderiza a árvore do `project.json` visualmente (só a primeira página do projeto, por enquanto).
  - Seleção por clique, drag-and-drop simples (paleta → frame, mover nó entre frames), blocos básicos (frame, texto, imagem, botão).
  - Inspector para editar nome, props e estilos (JSON) do bloco selecionado, com botão de excluir.
  - Troca de breakpoint ativo (desktop/tablet/mobile) com cascata de estilos.
  - Botão "Salvar" persiste via `PUT /api/projects/[repo]` (commit no GitHub).
- **Fase 2 — Responsividade + estilos** ✅ (`src/components/StyleEditor.tsx`)
  - Editor visual de estilos por breakpoint no Inspector: layout (direção, alinhamento, espaço entre itens) para containers, espaçamento, dimensões, tipografia (para texto/botão) e aparência (cor de fundo, cantos arredondados).
  - Campos vazios/"(herdado)" removem a propriedade do breakpoint ativo em vez de gravar um valor vazio.
  - Editor JSON bruto mantido como escape hatch avançado (`<details>` colapsável) para propriedades CSS ainda não cobertas visualmente.
- **Fase 3 — Component Library** ✅ (`src/lib/componentLibrary.ts`, `src/lib/framerCanvasShim.ts`, `src/components/library/`)
  - Componentes de `Framer Codes Component/` renderizam de verdade (não é placeholder) dentro do canvas, via um shim do pacote `framer` (só existe no runtime do editor do Framer) e um wrapper estático por componente.
  - Registry (`componentLibrary.ts`) descreve cada componente disponível: id, nome, empresa, props padrão e um subconjunto curado de props editáveis no Inspector (equivalente aos `propertyControls` do Framer).
  - Paleta ganhou seção "Componentes"; arrastar um para o canvas cria um nó `component-ref` com as props padrão do registry.
  - Adicionar um novo componente da biblioteca = criar um wrapper estático + uma entrada no registry (não há scan dinâmico de pasta).
- **Fase 4 — CMS + Animações** ✅ (`src/lib/collections.ts`, `src/components/CollectionsManager.tsx`, `src/lib/motion.ts`)
  - Coleções de dados (CMS): modal "Coleções" para criar coleções, campos tipados (texto, número, booleano, data, imagem, link) e itens (linhas).
  - Bloco "Coleção CMS" na paleta: ao soltar, cria um nó `cms-collection` com um template (frame + texto vinculado ao primeiro campo), auto-criando uma coleção inicial com 2 itens de exemplo se o projeto ainda não tiver nenhuma.
  - O template repete uma vez por item da coleção no canvas; nós texto/imagem dentro do template podem ser vinculados a um campo da coleção pelo Inspector (em vez de conteúdo fixo).
  - Animações: uma animação por nó (disparo onLoad/onScroll/onHover/onTap, efeito fade/slide/escala, duração/atraso), editável no Inspector e renderizada ao vivo no canvas via Framer Motion.
- **Fase 5 — Exportação dupla** ✅ (`src/lib/codegen/{css,jsx,exportSite,exportComponent}.ts`)
  - Botão "Exportar" no editor gera dois formatos a partir do `project.json` e commita no próprio repositório do projeto: `export/site/` (site Next.js completo, com CSS Module + media queries por breakpoint, pronto pra `npm install && npm run dev`/deploy) e `export/component/` (um `.tsx` por página, estilos inline, para colar como Custom Code Component no Framer ou importar em outro projeto React).
  - Testado de ponta a ponta: o site exportado foi buildado e rodado de forma independente (`next build && next start`) e renderizou corretamente — inclusive animação (Framer Motion) e repetição estática dos itens de uma cms-collection.
  - Limitação conhecida: componentes da biblioteca (`component-ref`, ex: `Framer Codes Component/AYVU/...`) ainda não são copiados automaticamente na exportação — viram um comentário no código indicando onde adicionar manualmente. Fica para uma iteração futura.
  - "Exportar" salva o projeto primeiro (a exportação lê o `project.json` persistido, não o estado em memória do editor).
- **Fase 6 — Persistência GitHub completa** ✅ (`src/components/VersionHistory.tsx`, `src/lib/store.ts`, `src/lib/github.ts`, `src/lib/localStore.ts`)
  - Autosave: salva ~2s após a última mudança, sem precisar clicar em "Salvar" (indicador de status no header); botão manual continua disponível para salvar na hora.
  - Histórico de versões: no GitHub, é o histórico de commits do `project.json` (`repos.listCommits`); no modo local, snapshots em disco (últimos 20). Modal "Histórico" lista e permite "Restaurar" qualquer versão anterior (vira um novo commit/salvamento, não reescreve histórico).
  - "Publicar": exporta o site atualizado e mostra um link real de "Deploy on Vercel" apontando pro repositório do projeto com `root-directory=export/site` — sem depender de credenciais de deploy. No modo local (sem GitHub), mostra aviso explicando por que não é possível.
  - Durante o teste, dois bugs reais corrigidos: rotas GET de versões precisavam de `export const dynamic = "force-dynamic"` (Next.js as trataria como estáticas/cacheadas por padrão); e qualquer erro de ação (salvar/exportar/publicar) derrubava a tela inteira do editor porque reusava o mesmo estado `error` do carregamento inicial — separado em `actionError` (banner dispensável) vs. erro de carregamento (tela cheia).

- **Fase 7 — Canvas/UX do editor** ✅ (`src/components/Canvas.tsx`)
  - Zoom/pan infinito no canvas: Ctrl/Cmd+scroll dá zoom centrado no cursor; espaço+arrastar (ou botão do meio) faz pan; controles de zoom fixos no canto do canvas.
  - Resize por 8 handles nas bordas/cantos do bloco selecionado, escrevendo `width`/`height` no breakpoint ativo.
  - Guias de alinhamento inteligentes durante o resize: a largura/altura gruda quando bate com a de um irmão ou o conteúdo do pai (layout é flexbox, então o snap é de dimensão, não de posição x/y como num canvas livre).
  - Seleção múltipla: shift+clique e retângulo de seleção (arrastar a partir da área vazia do canvas); banner de exclusão em lote quando há mais de um bloco selecionado.
  - Todos os blocos passaram a usar `box-sizing: border-box` (canvas e exportação) — corrige uma inconsistência real encontrada durante o teste: os candidatos de snap eram medidos pela caixa externa (`getBoundingClientRect`) enquanto `width` no estilo era o conteúdo interno (`content-box` padrão), o que fazia o snap ficar impreciso sempre que havia padding.
  - Testado de ponta a ponta com Playwright: zoom (botões e Ctrl+scroll), resize com snap exato + linha guia visível durante o arraste, persistência via autosave, seleção múltipla (shift+clique e retângulo) com exclusão em lote persistida após reload.

## Mapeamento de recursos pagos do Framer → equivalente gratuito

| Recurso Framer (pago) | Equivalente |
|---|---|
| CMS Collections | Coleções JSON no `project.json`, versionadas no repo |
| Custom code components | `Framer Codes Component/` (já existe neste repositório) |
| Domínio customizado | Vercel/Netlify free permite domínio próprio |
| Animações avançadas | Framer Motion |
| Formulários | Formspree / função serverless própria |
| Localization (i18n) | next-intl / rota por locale |
| Password protection | Middleware no Next.js gerado |
| Staging/preview | Preview deployments do Vercel por branch/PR |
| SEO | Meta tags geradas do schema + sitemap.xml |

## Riscos conhecidos

- Escopo grande: editor visual completo é trabalho de meses, incremental por fase.
- Rate limit da API do GitHub (5000 req/h autenticado) — atenção ao autosave.
- Free tiers de deploy têm limites de banda/build minutes.
- Fidelidade total ao "feel" do Framer (performance de canvas, physics) é o item mais caro — priorizado por último.
