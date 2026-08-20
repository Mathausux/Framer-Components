"use client";

import { useDraggable } from "@dnd-kit/core";
import { NodeType } from "@/lib/schema";
import { NODE_TYPE_LABELS } from "@/lib/nodeRenderer";
import { COMPONENT_LIBRARY } from "@/lib/componentLibrary";
import { DragData } from "./Canvas";

const PALETTE_ITEMS: NodeType[] = ["frame", "text", "image", "button", "cms-collection"];

export function Palette() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <h3 style={{ fontSize: 13, textTransform: "uppercase", color: "#777", margin: "0 0 4px" }}>
        Blocos
      </h3>
      {PALETTE_ITEMS.map((type) => (
        <PaletteItem key={type} label={NODE_TYPE_LABELS[type]} data={{ kind: "palette-item", nodeType: type }} />
      ))}

      {COMPONENT_LIBRARY.length > 0 && (
        <>
          <h3
            style={{
              fontSize: 13,
              textTransform: "uppercase",
              color: "#777",
              margin: "16px 0 4px",
            }}
          >
            Componentes
          </h3>
          {COMPONENT_LIBRARY.map((entry) => (
            <PaletteItem
              key={entry.id}
              label={entry.name}
              sublabel={entry.company}
              data={{ kind: "palette-item", nodeType: "component-ref", componentId: entry.id }}
            />
          ))}
        </>
      )}

      <p style={{ fontSize: 12, color: "#999", marginTop: 8 }}>
        Arraste um bloco para dentro de um frame no canvas.
      </p>
    </div>
  );
}

function PaletteItem({
  label,
  sublabel,
  data,
}: {
  label: string;
  sublabel?: string;
  data: DragData;
}) {
  const draggable = useDraggable({
    id: `palette-${data.kind === "palette-item" ? data.nodeType : ""}-${label}`,
    data,
  });

  return (
    <div
      ref={draggable.setNodeRef}
      {...draggable.listeners}
      {...draggable.attributes}
      style={{
        padding: "8px 12px",
        border: "1px solid #ddd",
        borderRadius: 6,
        cursor: "grab",
        background: "#fff",
        opacity: draggable.isDragging ? 0.4 : 1,
        userSelect: "none",
      }}
    >
      <div>{label}</div>
      {sublabel && <div style={{ fontSize: 11, color: "#999" }}>{sublabel}</div>}
    </div>
  );
}
