import { PageBuilderProject } from "../schema";
import { JsxContext, renderNodeJsx } from "./jsx";

function baseBreakpointId(project: PageBuilderProject): string {
  return (
    [...project.breakpoints].sort((a, b) => (b.maxWidth ?? Infinity) - (a.maxWidth ?? Infinity))[0]?.id ??
    "desktop"
  );
}

function pascalCase(input: string): string {
  const words = input.replace(/[^a-zA-Z0-9]+/g, " ").trim().split(/\s+/);
  return words.map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join("") || "Page";
}

/**
 * Gera um componente React de arquivo único por página, com estilos inline
 * (só o breakpoint mais largo — arquivo único não suporta media queries).
 * Pensado para colar como Custom Code Component no Framer ou importar em
 * qualquer projeto React existente. component-ref vira comentário, como na
 * exportação de site.
 */
export function generateComponentFiles(project: PageBuilderProject): Record<string, string> {
  const files: Record<string, string> = {};
  const collections = project.collections ?? {};
  const baseBp = baseBreakpointId(project);

  for (const page of project.pages) {
    const ctx: JsxContext = { mode: "inline", collections, baseBreakpointId: baseBp, usesMotion: false };
    const bodyJsx = renderNodeJsx(ctx, page.root, undefined, "    ");
    const name = pascalCase(page.id || page.title || page.path);

    const importsBlock = ['"use client";', ctx.usesMotion ? `import { motion } from "framer-motion";` : null]
      .filter((line): line is string => line !== null)
      .join("\n");

    files[`${name}.tsx`] =
      `${importsBlock}\n\n` +
      `export default function ${name}() {\n` +
      `  return (\n${bodyJsx}\n  );\n` +
      `}\n`;
  }

  return files;
}
