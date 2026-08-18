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
- **Fase 1 — Canvas MVP**
  - Renderizar a árvore do `project.json` visualmente.
  - Seleção, drag-and-drop simples, blocos básicos (frame, texto, imagem, botão).
- **Fase 2 — Responsividade + estilos**
  - Breakpoints (desktop/tablet/mobile), editor visual de estilos.
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
