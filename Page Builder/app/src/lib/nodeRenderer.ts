import { CSSProperties } from "react";
import { Breakpoint, Node } from "./schema";

/**
 * Resolve o estilo final de um nó para um breakpoint ativo, fazendo cascata
 * dos breakpoints maiores para os menores (mesma lógica de "desktop-first"
 * usada no restante do projeto): começa do maior breakpoint e vai
 * sobrescrevendo com os estilos definidos em breakpoints menores até chegar
 * no breakpoint ativo.
 */
export function resolveNodeStyles(
  node: Node,
  breakpoints: Breakpoint[],
  activeBreakpointId: string
): CSSProperties {
  const orderedIds = [...breakpoints]
    .sort((a, b) => (b.maxWidth ?? Infinity) - (a.maxWidth ?? Infinity))
    .map((bp) => bp.id);

  const activeIndex = orderedIds.indexOf(activeBreakpointId);
  const relevantIds = activeIndex >= 0 ? orderedIds.slice(0, activeIndex + 1) : orderedIds;

  let merged: CSSProperties = {};
  for (const id of relevantIds) {
    merged = { ...merged, ...(node.styles?.[id] as CSSProperties | undefined) };
  }
  return merged;
}

export const NODE_TYPE_LABELS: Record<Node["type"], string> = {
  frame: "Frame",
  text: "Texto",
  image: "Imagem",
  button: "Botão",
  "cms-collection": "Coleção CMS",
  "component-ref": "Componente",
  form: "Formulário",
};

export const DEFAULT_STYLES_BY_TYPE: Record<Node["type"], CSSProperties> = {
  frame: { display: "flex", flexDirection: "column", gap: 8, padding: 16, minHeight: 40 },
  text: { fontSize: 16, color: "#111111" },
  image: { width: "100%", maxWidth: 320, display: "block" },
  button: {
    padding: "8px 16px",
    background: "#0070f3",
    color: "#ffffff",
    borderRadius: 6,
    border: "none",
    display: "inline-block",
  },
  "cms-collection": { display: "flex", flexDirection: "column", gap: 8, padding: 8 },
  "component-ref": { display: "block", overflow: "hidden" },
  form: { display: "flex", flexDirection: "column", gap: 8, padding: 16 },
};
