"use client";

import { CSSProperties, MouseEvent, useEffect, useRef, useState, WheelEvent as ReactWheelEvent } from "react";
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
const MIN_ZOOM = 0.1;
const MAX_ZOOM = 3;

export interface CanvasProps {
  root: Node;
  breakpoints: Breakpoint[];
  activeBreakpointId: string;
  selectedId: string | null;
  onSelect: (id: string) => void;
  collections: Record<string, Collection>;
  onResize?: (nodeId: string, width: number, height: number) => void;
  /** Seleção múltipla (shift+click e retângulo de seleção). Opcional — sem isso o Canvas continua funcionando com seleção única. */
  selectedIds?: string[];
  onToggleSelect?: (id: string) => void;
  onSelectMultiple?: (ids: string[]) => void;
}

type HandlePos = "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw";

const HANDLES: { pos: HandlePos; cursor: string; top: string; left: string }[] = [
  { pos: "nw", cursor: "nwse-resize", top: "0%", left: "0%" },
  { pos: "n", cursor: "ns-resize", top: "0%", left: "50%" },
  { pos: "ne", cursor: "nesw-resize", top: "0%", left: "100%" },
  { pos: "e", cursor: "ew-resize", top: "50%", left: "100%" },
  { pos: "se", cursor: "nwse-resize", top: "100%", left: "100%" },
  { pos: "s", cursor: "ns-resize", top: "100%", left: "50%" },
  { pos: "sw", cursor: "nesw-resize", top: "100%", left: "0%" },
  { pos: "w", cursor: "ew-resize", top: "50%", left: "0%" },
];

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function isTypingTarget(target: EventTarget | null) {
  const el = target as HTMLElement | null;
  if (!el) return false;
  const tag = el.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || el.isContentEditable;
}

/**
 * Renderiza a árvore do projeto dentro de uma superfície com zoom/pan
 * infinito (estilo Framer): scroll com Ctrl/Cmd dá zoom centrado no cursor,
 * segurar espaço + arrastar (ou botão do meio do mouse) faz pan.
 * Precisa estar dentro de um <DndContext> fornecido por quem a usa (junto
 * com a <Palette />), já que blocos podem ser arrastados entre os dois.
 */
export function Canvas({
  root,
  breakpoints,
  activeBreakpointId,
  selectedId,
  onSelect,
  collections,
  onResize,
  selectedIds,
  onToggleSelect,
  onSelectMultiple,
}: CanvasProps) {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const marqueeState = useRef<{ startX: number; startY: number } | null>(null);
  const marqueeRectRef = useRef<{ left: number; top: number; width: number; height: number } | null>(null);
  const [marqueeRect, setMarqueeRect] = useState<{ left: number; top: number; width: number; height: number } | null>(
    null
  );
  const [isMarqueeActive, setIsMarqueeActive] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 40, y: 40 });
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const panState = useRef<{ startX: number; startY: number; startPanX: number; startPanY: number } | null>(null);
  const [isPanning, setIsPanning] = useState(false);
  const nodeElsRef = useRef(new Map<string, HTMLElement>());
  const [selectedRect, setSelectedRect] = useState<{ left: number; top: number; width: number; height: number } | null>(
    null
  );
  const resizeState = useRef<{
    nodeId: string;
    handle: HandlePos;
    startX: number;
    startY: number;
    startWidth: number;
    startHeight: number;
  } | null>(null);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeGuides, setResizeGuides] = useState<{ x: number | null; y: number | null }>({ x: null, y: null });

  function registerNodeEl(id: string, el: HTMLElement | null) {
    if (el) nodeElsRef.current.set(id, el);
    else nodeElsRef.current.delete(id);
  }

  function recomputeSelectedRect() {
    const wrapperEl = wrapperRef.current;
    const el = selectedId ? nodeElsRef.current.get(selectedId) : undefined;
    if (!wrapperEl || !el || selectedId === root.id) {
      setSelectedRect(null);
      return;
    }
    const elRect = el.getBoundingClientRect();
    const wrapperRect = wrapperEl.getBoundingClientRect();
    setSelectedRect({
      left: elRect.left - wrapperRect.left,
      top: elRect.top - wrapperRect.top,
      width: elRect.width,
      height: elRect.height,
    });
  }

  useEffect(() => {
    recomputeSelectedRect();
    window.addEventListener("resize", recomputeSelectedRect);
    return () => window.removeEventListener("resize", recomputeSelectedRect);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, zoom, pan, root]);

  function handleResizeStart(e: MouseEvent, handle: HandlePos) {
    if (!selectedId || !onResize) return;
    e.stopPropagation();
    e.preventDefault();
    const el = nodeElsRef.current.get(selectedId);
    if (!el) return;
    const rect = el.getBoundingClientRect();
    resizeState.current = {
      nodeId: selectedId,
      handle,
      startX: e.clientX,
      startY: e.clientY,
      startWidth: rect.width / zoom,
      startHeight: rect.height / zoom,
    };
    setIsResizing(true);
  }

  /** Larguras/alturas "candidatas" pra grudar: irmãos no mesmo pai + conteúdo do próprio pai. */
  function collectSnapCandidates(parentEl: HTMLElement, selfEl: HTMLElement, axis: "width" | "height") {
    const parentRect = parentEl.getBoundingClientRect();
    const cs = window.getComputedStyle(parentEl);
    const padding =
      axis === "width"
        ? parseFloat(cs.paddingLeft || "0") + parseFloat(cs.paddingRight || "0")
        : parseFloat(cs.paddingTop || "0") + parseFloat(cs.paddingBottom || "0");
    const candidates = [((axis === "width" ? parentRect.width : parentRect.height) - padding) / zoom];
    Array.from(parentEl.children).forEach((child) => {
      if (child === selfEl) return;
      const r = (child as HTMLElement).getBoundingClientRect();
      candidates.push((axis === "width" ? r.width : r.height) / zoom);
    });
    return candidates;
  }

  useEffect(() => {
    if (!isResizing) return;
    function handleMove(e: globalThis.MouseEvent) {
      const state = resizeState.current;
      const wrapperEl = wrapperRef.current;
      if (!state || !onResize || !wrapperEl) return;
      const dx = (e.clientX - state.startX) / zoom;
      const dy = (e.clientY - state.startY) / zoom;
      const growX = state.handle.includes("e") ? 1 : state.handle.includes("w") ? -1 : 0;
      const growY = state.handle.includes("s") ? 1 : state.handle.includes("n") ? -1 : 0;
      let width = Math.max(8, state.startWidth + dx * growX);
      let height = Math.max(8, state.startHeight + dy * growY);

      let guideX: number | null = null;
      let guideY: number | null = null;
      const el = nodeElsRef.current.get(state.nodeId);
      const parentEl = el?.parentElement ?? null;
      if (el && parentEl) {
        const wrapperRect = wrapperEl.getBoundingClientRect();
        const elRect = el.getBoundingClientRect();
        const tolerance = 6 / zoom;

        if (growX !== 0) {
          const match = collectSnapCandidates(parentEl, el, "width").find((c) => Math.abs(width - c) <= tolerance);
          if (match !== undefined) {
            width = match;
            const fixedEdge = growX === 1 ? elRect.left : elRect.right;
            guideX = fixedEdge + growX * match * zoom - wrapperRect.left;
          }
        }
        if (growY !== 0) {
          const match = collectSnapCandidates(parentEl, el, "height").find((c) => Math.abs(height - c) <= tolerance);
          if (match !== undefined) {
            height = match;
            const fixedEdge = growY === 1 ? elRect.top : elRect.bottom;
            guideY = fixedEdge + growY * match * zoom - wrapperRect.top;
          }
        }
      }

      setResizeGuides({ x: guideX, y: guideY });
      onResize(state.nodeId, Math.round(width), Math.round(height));
    }
    function handleUp() {
      resizeState.current = null;
      setIsResizing(false);
      setResizeGuides({ x: null, y: null });
    }
    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);
    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isResizing, zoom, onResize]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.code === "Space" && !isTypingTarget(e.target)) {
        setIsSpacePressed(true);
      }
    }
    function handleKeyUp(e: KeyboardEvent) {
      if (e.code === "Space") setIsSpacePressed(false);
    }
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  function zoomAt(clientX: number, clientY: number, nextZoom: number) {
    const rect = wrapperRef.current?.getBoundingClientRect();
    if (!rect) return;
    const mouseX = clientX - rect.left;
    const mouseY = clientY - rect.top;
    setZoom((prevZoom) => {
      const clamped = clamp(nextZoom, MIN_ZOOM, MAX_ZOOM);
      setPan((prevPan) => {
        const worldX = (mouseX - prevPan.x) / prevZoom;
        const worldY = (mouseY - prevPan.y) / prevZoom;
        return { x: mouseX - worldX * clamped, y: mouseY - worldY * clamped };
      });
      return clamped;
    });
  }

  function handleWheel(e: ReactWheelEvent<HTMLDivElement>) {
    if (!e.ctrlKey && !e.metaKey) return;
    e.preventDefault();
    const factor = Math.exp(-e.deltaY * 0.01);
    zoomAt(e.clientX, e.clientY, zoom * factor);
  }

  function handlePointerDown(e: MouseEvent) {
    if (isSpacePressed || e.button === 1) {
      e.preventDefault();
      panState.current = { startX: e.clientX, startY: e.clientY, startPanX: pan.x, startPanY: pan.y };
      setIsPanning(true);
      return;
    }
    // Retângulo de seleção: só inicia clicando na área vazia (fora do artboard), com o botão esquerdo.
    if (e.button === 0 && e.target === wrapperRef.current) {
      const rect = wrapperRef.current.getBoundingClientRect();
      const start = { startX: e.clientX - rect.left, startY: e.clientY - rect.top };
      marqueeState.current = start;
      const initialRect = { left: start.startX, top: start.startY, width: 0, height: 0 };
      marqueeRectRef.current = initialRect;
      setMarqueeRect(initialRect);
      setIsMarqueeActive(true);
    }
  }

  useEffect(() => {
    if (!isPanning) return;
    function handleMove(e: globalThis.MouseEvent) {
      const start = panState.current;
      if (!start) return;
      setPan({ x: start.startPanX + (e.clientX - start.startX), y: start.startPanY + (e.clientY - start.startY) });
    }
    function handleUp() {
      panState.current = null;
      setIsPanning(false);
    }
    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);
    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
    };
  }, [isPanning]);

  useEffect(() => {
    if (!isMarqueeActive) return;
    function handleMove(e: globalThis.MouseEvent) {
      const start = marqueeState.current;
      const wrapperEl = wrapperRef.current;
      if (!start || !wrapperEl) return;
      const rect = wrapperEl.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const next = {
        left: Math.min(start.startX, x),
        top: Math.min(start.startY, y),
        width: Math.abs(x - start.startX),
        height: Math.abs(y - start.startY),
      };
      marqueeRectRef.current = next;
      setMarqueeRect(next);
    }
    function handleUp() {
      const finalRect = marqueeRectRef.current;
      const wrapperEl = wrapperRef.current;
      if (finalRect && wrapperEl && onSelectMultiple && (finalRect.width > 4 || finalRect.height > 4)) {
        const wrapperRect = wrapperEl.getBoundingClientRect();
        const marqueeScreen = {
          left: wrapperRect.left + finalRect.left,
          top: wrapperRect.top + finalRect.top,
          right: wrapperRect.left + finalRect.left + finalRect.width,
          bottom: wrapperRect.top + finalRect.top + finalRect.height,
        };
        const hits: string[] = [];
        nodeElsRef.current.forEach((el, id) => {
          if (id === root.id) return;
          const r = el.getBoundingClientRect();
          const intersects =
            r.left < marqueeScreen.right &&
            r.right > marqueeScreen.left &&
            r.top < marqueeScreen.bottom &&
            r.bottom > marqueeScreen.top;
          if (intersects) hits.push(id);
        });
        onSelectMultiple(hits);
      }
      marqueeState.current = null;
      marqueeRectRef.current = null;
      setIsMarqueeActive(false);
      setMarqueeRect(null);
    }
    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);
    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMarqueeActive]);

  function zoomButton(factor: number) {
    const rect = wrapperRef.current?.getBoundingClientRect();
    if (!rect) return;
    zoomAt(rect.left + rect.width / 2, rect.top + rect.height / 2, zoom * factor);
  }

  function resetZoom() {
    setZoom(1);
    setPan({ x: 40, y: 40 });
  }

  return (
    <div
      ref={wrapperRef}
      onWheel={handleWheel}
      onMouseDown={handlePointerDown}
      style={{
        position: "relative",
        overflow: "hidden",
        width: "100%",
        height: "100%",
        background: "#e5e5e5",
        cursor: isSpacePressed ? (isPanning ? "grabbing" : "grab") : "default",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: "0 0",
          pointerEvents: isSpacePressed ? "none" : "auto",
        }}
      >
        <div
          style={{ background: "#fff", boxShadow: "0 0 0 1px #ddd, 0 8px 24px rgba(0,0,0,0.06)", padding: 24 }}
          onClick={() => onSelect(root.id)}
        >
          <NodeView
            node={root}
            breakpoints={breakpoints}
            activeBreakpointId={activeBreakpointId}
            selectedId={selectedId}
            selectedIds={selectedIds}
            onSelect={onSelect}
            onToggleSelect={onToggleSelect}
            collections={collections}
            registerRef={registerNodeEl}
            isRoot
          />
        </div>
      </div>

      {marqueeRect && (
        <div
          style={{
            position: "absolute",
            left: marqueeRect.left,
            top: marqueeRect.top,
            width: marqueeRect.width,
            height: marqueeRect.height,
            border: "1px solid #0070f3",
            background: "rgba(0,112,243,0.08)",
            pointerEvents: "none",
          }}
        />
      )}

      {resizeGuides.x !== null && (
        <div
          style={{
            position: "absolute",
            left: resizeGuides.x,
            top: 0,
            bottom: 0,
            width: 1,
            background: "#ff2d78",
            pointerEvents: "none",
          }}
        />
      )}
      {resizeGuides.y !== null && (
        <div
          style={{
            position: "absolute",
            top: resizeGuides.y,
            left: 0,
            right: 0,
            height: 1,
            background: "#ff2d78",
            pointerEvents: "none",
          }}
        />
      )}

      {selectedRect && onResize && (
        <div
          style={{
            position: "absolute",
            left: selectedRect.left,
            top: selectedRect.top,
            width: selectedRect.width,
            height: selectedRect.height,
            pointerEvents: "none",
          }}
        >
          {HANDLES.map((h) => (
            <div
              key={h.pos}
              onMouseDown={(e) => handleResizeStart(e, h.pos)}
              style={{
                position: "absolute",
                top: h.top,
                left: h.left,
                width: 8,
                height: 8,
                marginTop: -4,
                marginLeft: -4,
                background: "#fff",
                border: "1.5px solid #0070f3",
                borderRadius: 2,
                cursor: h.cursor,
                pointerEvents: "auto",
              }}
            />
          ))}
        </div>
      )}

      <div
        style={{
          position: "absolute",
          bottom: 16,
          right: 16,
          display: "flex",
          alignItems: "center",
          gap: 4,
          background: "#fff",
          border: "1px solid #ddd",
          borderRadius: 6,
          padding: 4,
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          fontSize: 12,
        }}
      >
        <button
          onClick={() => zoomButton(1 / 1.2)}
          style={{ border: "none", background: "none", cursor: "pointer", width: 24, height: 24 }}
          title="Diminuir zoom"
        >
          −
        </button>
        <button
          onClick={resetZoom}
          style={{ border: "none", background: "none", cursor: "pointer", minWidth: 44 }}
          title="Redefinir zoom (100%)"
        >
          {Math.round(zoom * 100)}%
        </button>
        <button
          onClick={() => zoomButton(1.2)}
          style={{ border: "none", background: "none", cursor: "pointer", width: 24, height: 24 }}
          title="Aumentar zoom"
        >
          +
        </button>
      </div>
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
  selectedIds,
  onSelect,
  onToggleSelect,
  collections,
  isRoot,
  bindingItem,
  registerRef,
}: {
  node: Node;
  breakpoints: Breakpoint[];
  activeBreakpointId: string;
  selectedId: string | null;
  selectedIds?: string[];
  onSelect: (id: string) => void;
  onToggleSelect?: (id: string) => void;
  collections: Record<string, Collection>;
  isRoot?: boolean;
  bindingItem?: Record<string, unknown>;
  registerRef?: (id: string, el: HTMLElement | null) => void;
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

  const isSelected = selectedId === node.id || (selectedIds?.includes(node.id) ?? false);
  const style: CSSProperties = {
    boxSizing: "border-box",
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
    if (e.shiftKey && onToggleSelect) onToggleSelect(node.id);
    else onSelect(node.id);
  }

  function setRefs(el: HTMLDivElement | null) {
    droppable.setNodeRef(el);
    draggable.setNodeRef(el);
    registerRef?.(node.id, el);
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
          selectedIds={selectedIds}
          onSelect={onSelect}
          onToggleSelect={onToggleSelect}
          registerRef={registerRef}
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
            selectedIds={selectedIds}
            onSelect={onSelect}
            onToggleSelect={onToggleSelect}
            collections={collections}
            registerRef={registerRef}
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
  selectedIds,
  onSelect,
  onToggleSelect,
  registerRef,
}: {
  node: Node;
  collections: Record<string, Collection>;
  breakpoints: Breakpoint[];
  activeBreakpointId: string;
  selectedId: string | null;
  selectedIds?: string[];
  onSelect: (id: string) => void;
  onToggleSelect?: (id: string) => void;
  registerRef?: (id: string, el: HTMLElement | null) => void;
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
            selectedIds={selectedIds}
            onSelect={onSelect}
            onToggleSelect={onToggleSelect}
            collections={collections}
            bindingItem={item}
            registerRef={registerRef}
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
    boxSizing: "border-box",
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
