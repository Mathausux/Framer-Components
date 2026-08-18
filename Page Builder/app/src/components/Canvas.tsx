"use client";

import { CSSProperties, MouseEvent } from "react";
import { motion } from "framer-motion";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import { Breakpoint, Collection, Node, NodeType } from "@/lib/schema";
import { DEFAULT_STYLES_BY_TYPE, NODE_TYPE_LABELS, resolveNodeStyles } from "@/lib/nodeRenderer";
import { getComponentLibraryEntry } from "@/lib/componentLibrary";
import { getMotionProps } from "@/lib/motion";

export type DragData =
  | { kind: "palette-item"; nodeType: NodeType; componentId?: string }
  | { kind: "canvas-node"; nodeId: string };

const CONTAINER_TYPES: NodeType[] = ["frame", "cms-collection", "form"];

export interface CanvasProps {
  root: Node;
  breakpoints: Breakpoint[];
  activeBreakpointId: string;
  selectedId: string | null;
  onSelect: (id: string) => void;
  collections: Record<string, Collection>;
}

/**
 * Renderiza a árvore do projeto. Precisa estar dentro de um <DndContext>
 * fornecido por quem a usa (junto com a <Palette />), já que blocos podem
 * ser arrastados entre os dois.
 */
export function Canvas({
  root,
  breakpoints,
  activeBreakpointId,
  selectedId,
  onSelect,
  collections,
}: CanvasProps) {
  return (
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
        collections={collections}
        isRoot
      />
    </div>
  );
}

function resolveBoundValue(node: Node, bindingItem: Record<string, unknown> | undefined) {
  const fieldId = (node.props?.binding as { field?: string } | undefined)?.field;
  if (!fieldId || !bindingItem) return undefined;
  return bindingItem[fieldId];
}

function NodeView({
  node,
  breakpoints,
  activeBreakpointId,
  selectedId,
  onSelect,
  collections,
  isRoot,
  bindingItem,
}: {
  node: Node;
  breakpoints: Breakpoint[];
  activeBreakpointId: string;
  selectedId: string | null;
  onSelect: (id: string) => void;
  collections: Record<string, Collection>;
  isRoot?: boolean;
  bindingItem?: Record<string, unknown>;
}) {
  const isContainer = CONTAINER_TYPES.includes(node.type);
  const hasTemplate = node.type === "cms-collection" && (node.children?.length ?? 0) > 0;
  // Uma cms-collection já com template só aceita 1 filho (o template); só fica
  // "droppable" de novo se o template for removido.
  const droppable = useDroppable({ id: node.id, disabled: !isContainer || hasTemplate });
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

  const boundValue = resolveBoundValue(node, bindingItem);
  const textContent = boundValue !== undefined ? String(boundValue) : ((node.props?.content as string) ?? "");
  const imageSrc = boundValue !== undefined ? String(boundValue) : (node.props?.src as string) || "";

  const innerContent = (
    <>
      {node.type === "text" && textContent}
      {node.type === "image" && (
        <img
          src={imageSrc || "https://placehold.co/320x180"}
          alt={(node.props?.alt as string) || ""}
          style={{ width: "100%", display: "block", pointerEvents: "none" }}
        />
      )}
      {node.type === "button" && ((node.props?.label as string) || "Botão")}
      {node.type === "component-ref" && <ComponentRefView node={node} />}
      {hasTemplate && (
        <CmsCollectionChildren
          node={node}
          collections={collections}
          breakpoints={breakpoints}
          activeBreakpointId={activeBreakpointId}
          selectedId={selectedId}
          onSelect={onSelect}
        />
      )}
      {isContainer &&
        !hasTemplate &&
        node.children?.map((child) => (
          <NodeView
            key={child.id}
            node={child}
            breakpoints={breakpoints}
            activeBreakpointId={activeBreakpointId}
            selectedId={selectedId}
            onSelect={onSelect}
            collections={collections}
            bindingItem={bindingItem}
          />
        ))}
      {isContainer && !hasTemplate && (node.children?.length ?? 0) === 0 && (
        <span style={{ fontSize: 12, color: "#aaa" }}>Solte um bloco aqui</span>
      )}
    </>
  );

  const animation = node.animations?.[0];
  if (animation) {
    return (
      <motion.div
        ref={setRefs}
        style={style}
        onClick={handleClick}
        title={node.name || NODE_TYPE_LABELS[node.type]}
        {...dragHandleProps}
        {...getMotionProps(animation)}
      >
        {innerContent}
      </motion.div>
    );
  }

  return (
    <div
      ref={setRefs}
      style={style}
      onClick={handleClick}
      title={node.name || NODE_TYPE_LABELS[node.type]}
      {...dragHandleProps}
    >
      {innerContent}
    </div>
  );
}

/**
 * Repete o template (node.children[0]) uma vez por item da coleção
 * vinculada, resolvendo os bindings de campo contra os dados de cada item.
 * Só a primeira instância é interativa (seleção/drag) — as demais são um
 * preview somente-visual, já que todas representam o mesmo nó-template.
 */
function CmsCollectionChildren({
  node,
  collections,
  breakpoints,
  activeBreakpointId,
  selectedId,
  onSelect,
}: {
  node: Node;
  collections: Record<string, Collection>;
  breakpoints: Breakpoint[];
  activeBreakpointId: string;
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const collectionId = node.props?.collectionId as string | undefined;
  const collection = collectionId ? collections[collectionId] : undefined;
  const template = node.children?.[0];

  if (!collection) {
    return (
      <span style={{ fontSize: 12, color: "#aaa" }}>
        Selecione uma coleção no Inspector para esta Coleção CMS.
      </span>
    );
  }

  if (!template) {
    return <span style={{ fontSize: 12, color: "#aaa" }}>Coleção sem template.</span>;
  }

  if (collection.items.length === 0) {
    return <span style={{ fontSize: 12, color: "#aaa" }}>Coleção "{collection.name}" sem itens.</span>;
  }

  return (
    <>
      {collection.items.map((item, index) =>
        index === 0 ? (
          <NodeView
            key={template.id}
            node={template}
            breakpoints={breakpoints}
            activeBreakpointId={activeBreakpointId}
            selectedId={selectedId}
            onSelect={onSelect}
            collections={collections}
            bindingItem={item}
          />
        ) : (
          <TemplatePreview
            key={`${template.id}-${index}`}
            node={template}
            breakpoints={breakpoints}
            activeBreakpointId={activeBreakpointId}
            bindingItem={item}
            onSelect={onSelect}
          />
        )
      )}
    </>
  );
}

/**
 * Repetição não-interativa do template de uma cms-collection: sem hooks de
 * drag-and-drop (dnd-kit exige ids únicos por elemento, e todas as
 * repetições compartilham o id do nó-template), mas ainda clicável para
 * selecionar o template (edições afetam todas as repetições).
 */
function TemplatePreview({
  node,
  breakpoints,
  activeBreakpointId,
  bindingItem,
  onSelect,
}: {
  node: Node;
  breakpoints: Breakpoint[];
  activeBreakpointId: string;
  bindingItem: Record<string, unknown>;
  onSelect: (id: string) => void;
}) {
  const isContainer = CONTAINER_TYPES.includes(node.type);
  const style: CSSProperties = {
    ...DEFAULT_STYLES_BY_TYPE[node.type],
    ...resolveNodeStyles(node, breakpoints, activeBreakpointId),
    position: "relative",
    cursor: "pointer",
  };

  const boundValue = resolveBoundValue(node, bindingItem);
  const textContent = boundValue !== undefined ? String(boundValue) : ((node.props?.content as string) ?? "");
  const imageSrc = boundValue !== undefined ? String(boundValue) : (node.props?.src as string) || "";

  function handleClick(e: MouseEvent) {
    e.stopPropagation();
    onSelect(node.id);
  }

  return (
    <div style={style} onClick={handleClick} title={node.name || NODE_TYPE_LABELS[node.type]}>
      {node.type === "text" && textContent}
      {node.type === "image" && (
        <img
          src={imageSrc || "https://placehold.co/320x180"}
          alt={(node.props?.alt as string) || ""}
          style={{ width: "100%", display: "block", pointerEvents: "none" }}
        />
      )}
      {node.type === "button" && ((node.props?.label as string) || "Botão")}
      {node.type === "component-ref" && <ComponentRefView node={node} />}
      {isContainer &&
        node.children?.map((child) => (
          <TemplatePreview
            key={child.id}
            node={child}
            breakpoints={breakpoints}
            activeBreakpointId={activeBreakpointId}
            bindingItem={bindingItem}
            onSelect={onSelect}
          />
        ))}
    </div>
  );
}

/**
 * Renderiza o componente real da biblioteca (ex: os componentes de
 * `Framer Codes Component/`) dentro do canvas. pointerEvents "none" evita
 * que a interação interna do componente (botões, drag do slideshow) capture
 * o clique/arraste que o Canvas usa para seleção e drag-and-drop do nó.
 */
function ComponentRefView({ node }: { node: Node }) {
  const componentId = node.props?.componentId as string | undefined;
  const entry = componentId ? getComponentLibraryEntry(componentId) : undefined;

  if (!entry) {
    return (
      <div style={{ fontSize: 12, color: "#c0392b" }}>
        Componente não encontrado: {componentId ?? "(sem componentId)"}
      </div>
    );
  }

  const Component = entry.component;
  const componentProps = (node.props?.componentProps as Record<string, unknown>) ?? {};

  return (
    <div style={{ width: "100%", height: "100%", pointerEvents: "none" }}>
      <Component {...componentProps} />
    </div>
  );
}
