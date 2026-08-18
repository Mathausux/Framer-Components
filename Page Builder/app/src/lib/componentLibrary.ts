import dynamic from "next/dynamic";
import type { ComponentType } from "react";

/**
 * Descreve um campo editável de um componente da biblioteca no Inspector.
 * É um subconjunto curado (não o `propertyControls` inteiro do Framer) —
 * cobre os controles mais úteis de cada componente sem precisar de um
 * interpretador genérico de ControlType.
 */
export type EditablePropField =
  | { key: string; label: string; kind: "boolean" }
  | { key: string; label: string; kind: "number"; min?: number; max?: number; step?: number }
  | { key: string; label: string; kind: "color" }
  | { key: string; label: string; kind: "select"; options: [string, string][] }
  | { key: string; label: string; kind: "imageList" };

export interface ComponentLibraryEntry {
  /** Também usado como valor de node.props.componentId nos nós component-ref. */
  id: string;
  name: string;
  company: string;
  description: string;
  component: ComponentType<Record<string, unknown>>;
  defaultProps: Record<string, unknown>;
  editableProps: EditablePropField[];
}

export const COMPONENT_LIBRARY: ComponentLibraryEntry[] = [
  {
    id: "AYVU/CMSGallerySlideshow",
    name: "CMS Gallery Slideshow",
    company: "AYVU",
    description: "Slideshow de imagens com autoplay, setas e indicadores.",
    component: dynamic(() => import("../components/library/AyvuCmsGallerySlideshow"), {
      ssr: false,
    }) as unknown as ComponentType<Record<string, unknown>>,
    defaultProps: {
      images: [],
      autoplay: true,
      interval: 4,
      pauseOnHover: true,
      loop: true,
      transitionStyle: "fade",
      showArrows: true,
      showDots: true,
      showCounter: false,
      objectFit: "cover",
      borderRadius: 0,
      arrowColor: "#FFFFFF",
      dotColor: "rgba(255,255,255,0.5)",
      dotActiveColor: "#FFFFFF",
    },
    editableProps: [
      { key: "images", label: "Imagens (uma URL por linha)", kind: "imageList" },
      {
        key: "transitionStyle",
        label: "Transição",
        kind: "select",
        options: [
          ["fade", "Fade"],
          ["slide", "Slide"],
          ["zoom", "Zoom"],
        ],
      },
      { key: "autoplay", label: "Autoplay", kind: "boolean" },
      { key: "interval", label: "Intervalo (s)", kind: "number", min: 1, max: 20, step: 0.5 },
      { key: "pauseOnHover", label: "Pausar no hover", kind: "boolean" },
      { key: "loop", label: "Loop", kind: "boolean" },
      { key: "showArrows", label: "Setas", kind: "boolean" },
      { key: "showDots", label: "Indicadores", kind: "boolean" },
      { key: "showCounter", label: "Contador", kind: "boolean" },
      {
        key: "objectFit",
        label: "Ajuste da imagem",
        kind: "select",
        options: [
          ["cover", "Cobrir"],
          ["contain", "Conter"],
          ["fill", "Preencher"],
        ],
      },
      { key: "borderRadius", label: "Raio da borda", kind: "number", min: 0, max: 100 },
      { key: "arrowColor", label: "Cor das setas", kind: "color" },
      { key: "dotColor", label: "Cor do indicador", kind: "color" },
      { key: "dotActiveColor", label: "Cor do indicador ativo", kind: "color" },
    ],
  },
];

export function getComponentLibraryEntry(id: string): ComponentLibraryEntry | undefined {
  return COMPONENT_LIBRARY.find((entry) => entry.id === id);
}
