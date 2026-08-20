/**
 * Shim mínimo do pacote "framer" (disponível só dentro do runtime do canvas
 * do Framer, não é um pacote npm real). Os componentes em
 * `Framer Codes Component/` importam `addPropertyControls`/`ControlType` de
 * "framer" apenas para registrar o painel de propriedades do editor do
 * Framer — a lógica de renderização em si não depende disso. Este shim
 * substitui o import (via alias no next.config.mjs) para permitir rodar os
 * mesmos componentes de verdade dentro do canvas do Page Builder.
 */

export function addPropertyControls(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _component: any,
  _controls: Record<string, unknown>
): void {
  // no-op: o Page Builder usa seu próprio registry (componentLibrary.ts)
  // para descrever quais props são editáveis, em vez de ler isto em runtime.
}

export const ControlType = {
  Array: "array",
  Boolean: "boolean",
  Color: "color",
  ComponentInstance: "componentInstance",
  Enum: "enum",
  File: "file",
  Image: "image",
  Number: "number",
  Object: "object",
  ResponsiveImage: "responsiveImage",
  String: "string",
} as const;
