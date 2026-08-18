"use client";

import { useDraggable } from "@dnd-kit/core";
import { NodeType } from "@/lib/schema";
import { NODE_TYPE_LABELS } from "@/lib/nodeRenderer";

const PALETTE_ITEMS: NodeType[] = ["frame", "text", "image", "button"];

export function Palette() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <h3 style={{ fontSize: 13, textTransform: "uppercase", color: "#777", margin: "0 0 4px" }}>
        Blocos
      </h3>
      {PALETTE_ITEMS.map((type) => (
        <PaletteItem key={type} type={type} />
      ))}
      <p style={{ fontSize: 12, color: "#999", marginTop: 8 }}>
        Arraste um bloco para dentro de um frame no canvas.
      </p>
    </div>
  );
}

function PaletteItem({ type }: { type: NodeType }) {
  const draggable = useDraggable({
    id: `palette-${type}`,
    data: { kind: "palette-item", nodeType: type },
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
      {NODE_TYPE_LABELS[type]}
    </div>
  );
}
