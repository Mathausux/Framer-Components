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
- **Fase 6 — Persistência GitHub completa**
  - Autosave com debounce, versionamento, botão publicar, preview deployments.
- **Fase 6 — Persistência GitHub completa**
  - Autosave com debounce, versionamento, botão publicar, preview deployments.

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
