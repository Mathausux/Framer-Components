import { Animation, Collection, Node } from "../schema";
import { getMotionProps } from "../motion";
import { cssIdent } from "./css";

export type JsxMode = "css-module" | "inline";

export interface JsxContext {
  mode: JsxMode;
  collections: Record<string, Collection>;
  /** Breakpoint mais largo (maxWidth null) — usado no modo inline, que não suporta media queries. */
  baseBreakpointId: string;
  /** Preenchido durante a geração: true se algum nó usa animação (para importar framer-motion). */
  usesMotion: boolean;
}

function boundValue(node: Node, bindingItem: Record<string, unknown> | undefined): string | undefined {
  const fieldId = (node.props?.binding as { field?: string } | undefined)?.field;
  if (!fieldId || !bindingItem) return undefined;
  const value = bindingItem[fieldId];
  return value === undefined ? undefined : String(value);
}

function jsExpr(value: unknown): string {
  return JSON.stringify(value);
}

function styleAttr(ctx: JsxContext, node: Node): string {
  if (ctx.mode === "css-module") {
    return `className={styles["n-${cssIdent(node.id)}"]}`;
  }
  const base = (node.styles?.[ctx.baseBreakpointId] as Record<string, unknown> | undefined) ?? {};
  return Object.keys(base).length > 0 ? `style={${jsExpr(base)}}` : "";
}

function motionAttrs(ctx: JsxContext, animation: Animation | undefined): string {
  if (!animation) return "";
  ctx.usesMotion = true;
  const props = getMotionProps(animation);
  return Object.entries(props)
    .map(([key, value]) => `${key}={${jsExpr(value)}}`)
    .join(" ");
}

/**
 * Gera o JSX (como texto) de um nó e seus filhos. `bindingItem` carrega os
 * dados do item de coleção atual quando o nó está dentro do template de uma
 * cms-collection (repetição estática — cada item vira um bloco JSX próprio,
 * sem `.map()` em runtime).
 */
export function renderNodeJsx(
  ctx: JsxContext,
  node: Node,
  bindingItem?: Record<string, unknown>,
  indent = ""
): string {
  const animation = node.animations?.[0];
  const tag = animation ? "motion.div" : "div";
  const style = styleAttr(ctx, node);
  const motion = motionAttrs(ctx, animation);
  const attrs = [style, motion].filter(Boolean).join(" ");
  const openAttrs = attrs ? ` ${attrs}` : "";

  switch (node.type) {
    case "text": {
      const content = boundValue(node, bindingItem) ?? (node.props?.content as string) ?? "";
      return `${indent}<${tag}${openAttrs}>{${jsExpr(content)}}</${tag}>`;
    }
    case "image": {
      const src = boundValue(node, bindingItem) ?? (node.props?.src as string) ?? "";
      const alt = (node.props?.alt as string) ?? "";
      if (!animation) {
        return `${indent}<img${attrs ? " " + attrs : ""} src={${jsExpr(src)}} alt={${jsExpr(alt)}} />`;
      }
      const imgStyle = jsExpr({ width: "100%", height: "100%", display: "block", objectFit: "cover" });
      return (
        `${indent}<${tag}${openAttrs}>\n` +
        `${indent}  <img src={${jsExpr(src)}} alt={${jsExpr(alt)}} style={${imgStyle}} />\n` +
        `${indent}</${tag}>`
      );
    }
    case "button": {
      const label = (node.props?.label as string) ?? "Botão";
      const buttonTag = animation ? "motion.button" : "button";
      return `${indent}<${buttonTag}${openAttrs}>{${jsExpr(label)}}</${buttonTag}>`;
    }
    case "component-ref": {
      const componentId = (node.props?.componentId as string) ?? "desconhecido";
      return `${indent}{/* Componente da biblioteca "${componentId}" não incluído nesta exportação — adicione manualmente. */}`;
    }
    case "cms-collection": {
      return renderCmsCollection(ctx, node, indent);
    }
    default: {
      const children = (node.children ?? [])
        .map((child) => renderNodeJsx(ctx, child, bindingItem, indent + "  "))
        .join("\n");
      if (!children) {
        return `${indent}<${tag}${openAttrs} />`;
      }
      return `${indent}<${tag}${openAttrs}>\n${children}\n${indent}</${tag}>`;
    }
  }
}

function renderCmsCollection(ctx: JsxContext, node: Node, indent: string): string {
  const collectionId = node.props?.collectionId as string | undefined;
  const collection = collectionId ? ctx.collections[collectionId] : undefined;
  const template = node.children?.[0];
  const wrapperStyle = styleAttr(ctx, node);
  const openAttrs = wrapperStyle ? ` ${wrapperStyle}` : "";

  if (!collection || !template || collection.items.length === 0) {
    return `${indent}<div${openAttrs} />`;
  }

  const items = collection.items.map((item) => renderNodeJsx(ctx, template, item, indent + "  ")).join("\n");

  return `${indent}<div${openAttrs}>\n${items}\n${indent}</div>`;
}
