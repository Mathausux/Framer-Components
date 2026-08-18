// Tipos TypeScript espelhando schema/project.schema.json (schemaVersion "0.1.0").
// Mantenha os dois em sincronia ao evoluir o modelo de dados.

export const SCHEMA_VERSION = "0.1.0" as const;

export interface Breakpoint {
  id: string;
  label: string;
  maxWidth: number | null;
}

export interface DesignTokens {
  colors?: Record<string, string>;
  spacing?: Record<string, number | string>;
  typography?: Record<
    string,
    {
      fontFamily?: string;
      fontSize?: number | string;
      fontWeight?: number | string;
      lineHeight?: number | string;
    }
  >;
}

export interface ComponentLibraryRef {
  id: string;
  source: "repo-local" | "external-repo" | "npm";
  path?: string;
  propsSchema?: Record<string, unknown>;
}

export type CollectionFieldType =
  | "text"
  | "richText"
  | "number"
  | "boolean"
  | "date"
  | "image"
  | "gallery"
  | "reference"
  | "url";

export interface CollectionField {
  id: string;
  type: CollectionFieldType;
  label?: string;
}

export interface Collection {
  id: string;
  name: string;
  fields: CollectionField[];
  items: Record<string, unknown>[];
}

export type NodeType =
  | "frame"
  | "text"
  | "image"
  | "button"
  | "cms-collection"
  | "component-ref"
  | "form";

export type AnimationTrigger = "onLoad" | "onScroll" | "onHover" | "onTap";
export type AnimationType = "fade" | "slide" | "scale" | "custom";

export interface Animation {
  trigger: AnimationTrigger;
  type: AnimationType;
  durationMs?: number;
  delayMs?: number;
  easing?: string;
  custom?: Record<string, unknown>;
}

export interface Node {
  id: string;
  type: NodeType;
  name?: string;
  props?: Record<string, unknown>;
  /** Chave = breakpoint id, valor = objeto de estilo. */
  styles?: Record<string, Record<string, unknown>>;
  animations?: Animation[];
  children?: Node[];
}

export interface PageSeo {
  title?: string;
  description?: string;
  ogImage?: string;
}

export interface Page {
  id: string;
  path: string;
  title?: string;
  seo?: PageSeo;
  root: Node;
}

export interface PageBuilderProject {
  schemaVersion: typeof SCHEMA_VERSION;
  projectId: string;
  name: string;
  createdAt?: string;
  updatedAt?: string;
  breakpoints: Breakpoint[];
  designTokens: DesignTokens;
  collections?: Record<string, Collection>;
  componentLibrary?: ComponentLibraryRef[];
  pages: Page[];
}
