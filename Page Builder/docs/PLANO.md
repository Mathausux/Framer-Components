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
- **Fase 3 — Component Library**
  - Integrar componentes de `Framer Codes Component/` como blocos arrastáveis.
- **Fase 4 — CMS + Animações**
  - Coleções de dados com binding de campos, Framer Motion no canvas.
- **Fase 5 — Exportação dupla**
  - Gerador de código React/Framer.
  - Gerador de site Next.js estático + deploy automático.
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
