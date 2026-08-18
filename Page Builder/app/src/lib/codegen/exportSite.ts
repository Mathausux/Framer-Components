import { PageBuilderProject } from "../schema";
import { generatePageCss } from "./css";
import { JsxContext, renderNodeJsx } from "./jsx";

function pageRouteDir(pagePath: string): string {
  const trimmed = pagePath.replace(/^\/+/, "").replace(/\/+$/, "");
  return trimmed ? `app/${trimmed}` : "app";
}

function baseBreakpointId(project: PageBuilderProject): string {
  return (
    [...project.breakpoints].sort((a, b) => (b.maxWidth ?? Infinity) - (a.maxWidth ?? Infinity))[0]?.id ??
    "desktop"
  );
}

/**
 * Gera um site Next.js completo e publicável a partir do project.json: uma
 * rota por página (App Router), CSS Module por página (com media queries
 * por breakpoint) e os arquivos de projeto mínimos (package.json,
 * next.config, layout raiz). Componentes da biblioteca (component-ref)
 * ainda não são incluídos automaticamente nesta fase — viram um comentário
 * no JSX gerado indicando onde adicionar manualmente.
 */
export function generateSiteFiles(project: PageBuilderProject): Record<string, string> {
  const files: Record<string, string> = {};
  const collections = project.collections ?? {};
  const baseBp = baseBreakpointId(project);

  files["package.json"] =
    JSON.stringify(
      {
        name: project.projectId,
        version: "0.1.0",
        private: true,
        scripts: { dev: "next dev", build: "next build", start: "next start" },
        dependencies: {
          next: "^14.2.35",
          react: "^18.3.1",
          "react-dom": "^18.3.1",
          "framer-motion": "^11.5.6",
        },
        devDependencies: {
          typescript: "^5.5.4",
          "@types/node": "^20.14.10",
          "@types/react": "^18.3.3",
          "@types/react-dom": "^18.3.0",
        },
      },
      null,
      2
    ) + "\n";

  files["next.config.mjs"] =
    "/** @type {import('next').NextConfig} */\nconst nextConfig = { reactStrictMode: true };\n\nexport default nextConfig;\n";

  files["tsconfig.json"] =
    JSON.stringify(
      {
        compilerOptions: {
          target: "ES2020",
          lib: ["dom", "dom.iterable", "esnext"],
          strict: true,
          noEmit: true,
          esModuleInterop: true,
          module: "esnext",
          moduleResolution: "bundler",
          resolveJsonModule: true,
          isolatedModules: true,
          jsx: "preserve",
          incremental: true,
          plugins: [{ name: "next" }],
        },
        include: ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
        exclude: ["node_modules"],
      },
      null,
      2
    ) + "\n";

  files["app/layout.tsx"] =
    `import type { ReactNode } from "react";\n` +
    `import "./globals.css";\n\n` +
    `export const metadata = { title: ${JSON.stringify(project.name)} };\n\n` +
    `export default function RootLayout({ children }: { children: ReactNode }) {\n` +
    `  return (\n` +
    `    <html lang="pt-BR">\n` +
    `      <body>{children}</body>\n` +
    `    </html>\n` +
    `  );\n` +
    `}\n`;

  files["app/globals.css"] =
    "* { box-sizing: border-box; margin: 0; padding: 0; }\n" +
    "body { font-family: system-ui, -apple-system, sans-serif; }\n" +
    "img { max-width: 100%; }\n";

  for (const page of project.pages) {
    const ctx: JsxContext = { mode: "css-module", collections, baseBreakpointId: baseBp, usesMotion: false };
    const bodyJsx = renderNodeJsx(ctx, page.root, undefined, "      ");
    const css = generatePageCss(page.root, project.breakpoints);
    const routeDir = pageRouteDir(page.path);

    const importsBlock = [
      `import styles from "./page.module.css";`,
      ctx.usesMotion ? `import { motion } from "framer-motion";` : null,
    ]
      .filter((line): line is string => line !== null)
      .join("\n");

    files[`${routeDir}/page.tsx`] =
      `"use client";\n\n${importsBlock}\n\n` +
      `export default function Page() {\n` +
      `  return (\n${bodyJsx}\n  );\n` +
      `}\n`;
    files[`${routeDir}/page.module.css`] = css ? `${css}\n` : "/* sem estilos declarados */\n";
  }

  files["README.md"] =
    `# ${project.name}\n\n` +
    `Site gerado automaticamente pelo Page Builder a partir do \`project.json\`.\n\n` +
    "```bash\nnpm install\nnpm run dev\n```\n\n" +
    "Para publicar, faça deploy deste diretório (ex: Vercel apontando para `export/site`).\n\n" +
    "> Componentes da biblioteca (\"Framer Codes Component/\") ainda não são incluídos automaticamente nesta exportação — procure comentários `{/* Componente ... */}` no código gerado.\n";

  return files;
}
