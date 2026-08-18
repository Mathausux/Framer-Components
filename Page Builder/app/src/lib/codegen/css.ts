import { Breakpoint, Node } from "../schema";

const NO_UNIT_PROPS = new Set([
  "opacity",
  "zIndex",
  "fontWeight",
  "lineHeight",
  "flex",
  "flexGrow",
  "flexShrink",
  "order",
  "zoom",
]);

function toKebabCase(prop: string): string {
  return prop.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
}

function cssValue(prop: string, value: unknown): string {
  if (typeof value === "number" && !NO_UNIT_PROPS.has(prop)) return `${value}px`;
  return String(value);
}

function declarationBlock(styles: Record<string, unknown>): string {
  return Object.entries(styles)
    .map(([key, value]) => `  ${toKebabCase(key)}: ${cssValue(key, value)};`)
    .join("\n");
}

/**
 * Gera o CSS Module (com media queries por breakpoint) para todos os nós da
 * árvore de uma página. Cada nó vira a classe `.n-<id>`; os estilos
 * declarados em breakpoints menores que o maior (maxWidth != null) ficam
 * dentro de `@media (max-width: ...)`, espelhando a cascata usada no canvas.
 */
export function generatePageCss(root: Node, breakpoints: Breakpoint[]): string {
  const ordered = [...breakpoints].sort((a, b) => (b.maxWidth ?? Infinity) - (a.maxWidth ?? Infinity));
  const chunks: string[] = [];

  function visit(node: Node) {
    const styles = node.styles ?? {};
    for (const bp of ordered) {
      const decl = styles[bp.id] as Record<string, unknown> | undefined;
      if (!decl || Object.keys(decl).length === 0) continue;
      const rule = `.n-${cssIdent(node.id)} {\n${declarationBlock(decl)}\n}`;
      chunks.push(bp.maxWidth == null ? rule : `@media (max-width: ${bp.maxWidth}px) {\n${rule}\n}`);
    }
    node.children?.forEach(visit);
  }

  visit(root);
  return chunks.join("\n\n");
}

/** Nomes de classe CSS só podem começar com letra/underscore/hífen; ids gerados já satisfazem isso. */
export function cssIdent(id: string): string {
  return id.replace(/[^a-zA-Z0-9_-]/g, "_");
}
