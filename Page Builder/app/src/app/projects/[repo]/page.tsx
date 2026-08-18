"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { Node, NodeType, PageBuilderProject } from "@/lib/schema";
import { findNode, generateNodeId, insertNode, moveNode, removeNode, updateNode } from "@/lib/tree";
import { DEFAULT_STYLES_BY_TYPE, NODE_TYPE_LABELS } from "@/lib/nodeRenderer";
import { getComponentLibraryEntry } from "@/lib/componentLibrary";
import { Canvas, DragData } from "@/components/Canvas";
import { Palette } from "@/components/Palette";
import { Inspector } from "@/components/Inspector";

export default function ProjectEditorPage() {
  const params = useParams<{ repo: string }>();
  const repo = params.repo;

  const [project, setProject] = useState<PageBuilderProject | null>(null);
  const [sha, setSha] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeBreakpointId, setActiveBreakpointId] = useState("desktop");
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } })
  );

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/projects/${repo}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Erro ao carregar projeto.");
        setProject(data.project);
        setSha(data.sha);
        setSelectedId(data.project.pages[0]?.root.id ?? null);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [repo]);

  if (loading) return <p style={{ padding: 24 }}>Carregando projeto…</p>;
  if (error) return <p style={{ padding: 24, color: "#c0392b" }}>{error}</p>;
  if (!project) return null;

  const page = project.pages[0];
  const root = page.root;
  const selectedNode = selectedId ? findNode(root, selectedId) : null;

  function updateRoot(nextRoot: Node) {
    setProject((prev) => {
      if (!prev) return prev;
      const nextPages = prev.pages.map((p, i) => (i === 0 ? { ...p, root: nextRoot } : p));
      return { ...prev, pages: nextPages };
    });
  }

  function handleDropPaletteItem(parentId: string, nodeType: NodeType, componentId?: string) {
    const isContainer = nodeType === "frame";
    const libraryEntry = componentId ? getComponentLibraryEntry(componentId) : undefined;

    const newNode: Node = {
      id: generateNodeId(nodeType),
      type: nodeType,
      name: libraryEntry?.name ?? NODE_TYPE_LABELS[nodeType],
      props: libraryEntry
        ? { componentId: libraryEntry.id, componentProps: { ...libraryEntry.defaultProps } }
        : nodeType === "text"
          ? { content: "Novo texto" }
          : nodeType === "button"
            ? { label: "Botão" }
            : nodeType === "image"
              ? { src: "", alt: "" }
              : {},
      styles: {
        desktop: (libraryEntry
          ? { width: "100%", height: 300 }
          : DEFAULT_STYLES_BY_TYPE[nodeType]) as Record<string, unknown>,
      },
      children: isContainer ? [] : undefined,
    };
    updateRoot(insertNode(root, parentId, newNode));
    setSelectedId(newNode.id);
  }

  function handleMoveNode(nodeId: string, newParentId: string) {
    updateRoot(moveNode(root, nodeId, newParentId));
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;

    const parentId = String(over.id);
    const data = active.data.current as DragData | undefined;
    if (!data) return;

    if (data.kind === "palette-item") {
      handleDropPaletteItem(parentId, data.nodeType, data.componentId);
    } else if (data.kind === "canvas-node" && data.nodeId !== parentId) {
      handleMoveNode(data.nodeId, parentId);
    }
  }

  function handleChangeProps(nodeId: string, props: Record<string, unknown>) {
    updateRoot(updateNode(root, nodeId, { props }));
  }

  function handleChangeStyles(nodeId: string, breakpointId: string, styles: Record<string, unknown>) {
    const node = findNode(root, nodeId);
    if (!node) return;
    updateRoot(updateNode(root, nodeId, { styles: { ...node.styles, [breakpointId]: styles } }));
  }

  function handleChangeName(nodeId: string, name: string) {
    updateRoot(updateNode(root, nodeId, { name }));
  }

  function handleDelete(nodeId: string) {
    updateRoot(removeNode(root, nodeId));
    setSelectedId(root.id);
  }

  async function handleSave() {
    if (!project || !sha) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${repo}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ project, sha }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao salvar projeto.");
      setSha(data.sha);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
    <div style={{ display: "grid", gridTemplateColumns: "220px 1fr 280px", height: "100vh" }}>
      <aside style={{ borderRight: "1px solid #eee", padding: 16, overflowY: "auto" }}>
        <Palette />
      </aside>

      <section style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <header
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "12px 16px",
            borderBottom: "1px solid #eee",
          }}
        >
          <div>
            <strong>{project.name}</strong>
            <div style={{ display: "flex", gap: 4, marginTop: 4 }}>
              {project.breakpoints.map((bp) => (
                <button
                  key={bp.id}
                  onClick={() => setActiveBreakpointId(bp.id)}
                  style={{
                    padding: "4px 10px",
                    fontSize: 12,
                    borderRadius: 4,
                    border: "1px solid #ddd",
                    background: activeBreakpointId === bp.id ? "#0070f3" : "#fff",
                    color: activeBreakpointId === bp.id ? "#fff" : "#333",
                    cursor: "pointer",
                  }}
                >
                  {bp.label}
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              padding: "8px 16px",
              background: "#111",
              color: "#fff",
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
            }}
          >
            {saving ? "Salvando…" : "Salvar"}
          </button>
        </header>

        <div style={{ flex: 1, overflow: "auto" }}>
          <Canvas
            root={root}
            breakpoints={project.breakpoints}
            activeBreakpointId={activeBreakpointId}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
        </div>
      </section>

      <aside style={{ borderLeft: "1px solid #eee", padding: 16, overflowY: "auto" }}>
        <Inspector
          node={selectedNode}
          isRoot={selectedNode?.id === root.id}
          onChangeProps={handleChangeProps}
          onChangeStyles={handleChangeStyles}
          onChangeName={handleChangeName}
          onDelete={handleDelete}
          activeBreakpointId={activeBreakpointId}
        />
      </aside>
    </div>
    </DndContext>
  );
}
