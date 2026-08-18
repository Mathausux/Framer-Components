"use client";

import { CSSProperties, MouseEvent } from "react";
import { DndContext, DragEndEvent, useDraggable, useDroppable } from "@dnd-kit/core";
import { Breakpoint, Node, NodeType } from "@/lib/schema";
import { DEFAULT_STYLES_BY_TYPE, NODE_TYPE_LABELS, resolveNodeStyles } from "@/lib/nodeRenderer";

type DragData =
  | { kind: "palette-item"; nodeType: NodeType }
  | { kind: "canvas-node"; nodeId: string };

const CONTAINER_TYPES: NodeType[] = ["frame", "cms-collection", "form"];

export interface CanvasProps {
  root: Node;
  breakpoints: Breakpoint[];
  activeBreakpointId: string;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onDropPaletteItem: (parentId: string, nodeType: NodeType) => void;
  onMoveNode: (nodeId: string, newParentId: string) => void;
}

export function Canvas({
  root,
  breakpoints,
  activeBreakpointId,
  selectedId,
  onSelect,
  onDropPaletteItem,
  onMoveNode,
}: CanvasProps) {
  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;

    const parentId = String(over.id);
    const data = active.data.current as DragData | undefined;
    if (!data) return;

    if (data.kind === "palette-item") {
      onDropPaletteItem(parentId, data.nodeType);
    } else if (data.kind === "canvas-node" && data.nodeId !== parentId) {
      onMoveNode(data.nodeId, parentId);
    }
  }

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div
        style={{ background: "#f5f5f5", minHeight: "100%", padding: 24 }}
        onClick={() => onSelect(root.id)}
      >
        <NodeView
          node={root}
          breakpoints={breakpoints}
          activeBreakpointId={activeBreakpointId}
          selectedId={selectedId}
          onSelect={onSelect}
          isRoot
        />
      </div>
    </DndContext>
  );
}

function NodeView({
  node,
  breakpoints,
  activeBreakpointId,
  selectedId,
  onSelect,
  isRoot,
}: {
  node: Node;
  breakpoints: Breakpoint[];
  activeBreakpointId: string;
  selectedId: string | null;
  onSelect: (id: string) => void;
  isRoot?: boolean;
}) {
  const isContainer = CONTAINER_TYPES.includes(node.type);
  const droppable = useDroppable({ id: node.id, disabled: !isContainer });
  const draggable = useDraggable({
    id: `drag-${node.id}`,
    data: { kind: "canvas-node", nodeId: node.id } satisfies DragData,
    disabled: isRoot,
  });

  const isSelected = selectedId === node.id;
  const style: CSSProperties = {
    ...DEFAULT_STYLES_BY_TYPE[node.type],
    ...resolveNodeStyles(node, breakpoints, activeBreakpointId),
    outline: isSelected
      ? "2px solid #0070f3"
      : droppable.isOver
        ? "2px dashed #0070f3"
        : "1px solid transparent",
    outlineOffset: -1,
    cursor: "pointer",
    opacity: draggable.isDragging ? 0.4 : 1,
    position: "relative",
  };

  function handleClick(e: MouseEvent) {
    e.stopPropagation();
    onSelect(node.id);
  }

  function setRefs(el: HTMLDivElement | null) {
    droppable.setNodeRef(el);
    draggable.setNodeRef(el);
  }

  const dragHandleProps = isRoot ? {} : { ...draggable.listeners, ...draggable.attributes };

  return (
    <div
      ref={setRefs}
      style={style}
      onClick={handleClick}
      title={node.name || NODE_TYPE_LABELS[node.type]}
      {...dragHandleProps}
    >
      {node.type === "text" && ((node.props?.content as string) ?? "")}
      {node.type === "image" && (
        <img
          src={(node.props?.src as string) || "https://placehold.co/320x180"}
          alt={(node.props?.alt as string) || ""}
          style={{ width: "100%", display: "block", pointerEvents: "none" }}
        />
      )}
      {node.type === "button" && ((node.props?.label as string) || "Botão")}
      {isContainer &&
        node.children?.map((child) => (
          <NodeView
            key={child.id}
            node={child}
            breakpoints={breakpoints}
            activeBreakpointId={activeBreakpointId}
            selectedId={selectedId}
            onSelect={onSelect}
          />
        ))}
      {isContainer && (node.children?.length ?? 0) === 0 && (
        <span style={{ fontSize: 12, color: "#aaa" }}>Solte um bloco aqui</span>
      )}
    </div>
  );
}
