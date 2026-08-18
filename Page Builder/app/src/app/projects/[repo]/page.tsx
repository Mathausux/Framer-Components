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
import { Animation, Node, NodeType, PageBuilderProject } from "@/lib/schema";
import {
  findAncestors,
  findNode,
  generateNodeId,
  insertNode,
  moveNode,
  removeNode,
  updateNode,
} from "@/lib/tree";
import { DEFAULT_STYLES_BY_TYPE, NODE_TYPE_LABELS } from "@/lib/nodeRenderer";
import { getComponentLibraryEntry } from "@/lib/componentLibrary";
import { addField, addItem, createCollection, updateItemField } from "@/lib/collections";
import { Canvas, DragData } from "@/components/Canvas";
import { Palette } from "@/components/Palette";
import { Inspector } from "@/components/Inspector";
import { CollectionsManager } from "@/components/CollectionsManager";

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
  const [exporting, setExporting] = useState(false);
  const [exportResult, setExportResult] = useState<string[] | null>(null);
  const [collectionsModalOpen, setCollectionsModalOpen] = useState(false);
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

  const ancestorPath = selectedId ? findAncestors(root, selectedId) : null;
  const ancestorCollectionNode = ancestorPath
    ? [...ancestorPath].reverse().slice(1).find((n) => n.type === "cms-collection")
    : undefined;
  const activeCollectionId = ancestorCollectionNode?.props?.collectionId as string | undefined;
  const activeCollection = activeCollectionId ? project.collections?.[activeCollectionId] : undefined;

  function updateRoot(nextRoot: Node) {
    setProject((prev) => {
      if (!prev) return prev;
      const nextPages = prev.pages.map((p, i) => (i === 0 ? { ...p, root: nextRoot } : p));
      return { ...prev, pages: nextPages };
    });
  }

  function handleDropPaletteItem(parentId: string, nodeType: NodeType, componentId?: string) {
    if (!project) return;

    if (nodeType === "cms-collection") {
      let collections = project.collections ?? {};
      let collectionId: string;

      if (Object.keys(collections).length === 0) {
        let starter = createCollection("Itens");
        starter = addField(starter, "Descrição", "text");
        const descFieldId = starter.fields[1].id;
        starter = addItem(starter);
        starter = updateItemField(starter, 0, "title", "Item 1");
        starter = updateItemField(starter, 0, descFieldId, "Descrição do item 1");
        starter = addItem(starter);
        starter = updateItemField(starter, 1, "title", "Item 2");
        starter = updateItemField(starter, 1, descFieldId, "Descrição do item 2");
        collections = { ...collections, [starter.id]: starter };
        collectionId = starter.id;
      } else {
        collectionId = Object.keys(collections)[0];
      }

      const collection = collections[collectionId];
      const titleFieldId = collection.fields[0]?.id ?? "title";

      const templateTextNode: Node = {
        id: generateNodeId("text"),
        type: "text",
        name: "Campo",
        props: { content: "", binding: { field: titleFieldId } },
        styles: { desktop: { fontSize: 16, color: "#111111" } },
      };
      const templateFrame: Node = {
        id: generateNodeId("frame"),
        type: "frame",
        name: "Item",
        props: {},
        styles: {
          desktop: {
            display: "flex",
            flexDirection: "column",
            gap: 4,
            padding: 12,
            border: "1px solid #eee",
            borderRadius: 6,
          },
        },
        children: [templateTextNode],
      };
      const collectionNode: Node = {
        id: generateNodeId("cms-collection"),
        type: "cms-collection",
        name: "Coleção CMS",
        props: { collectionId },
        styles: { desktop: DEFAULT_STYLES_BY_TYPE["cms-collection"] as Record<string, unknown> },
        children: [templateFrame],
      };

      const nextRoot = insertNode(root, parentId, collectionNode);
      const nextPages = project.pages.map((p, i) => (i === 0 ? { ...p, root: nextRoot } : p));
      setProject({ ...project, collections, pages: nextPages });
      setSelectedId(collectionNode.id);
      return;
    }

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

  function handleChangeAnimations(nodeId: string, animations: Animation[] | undefined) {
    updateRoot(updateNode(root, nodeId, { animations }));
  }

  function handleDelete(nodeId: string) {
    updateRoot(removeNode(root, nodeId));
    setSelectedId(root.id);
  }

  /** Persiste o project.json atual. Retorna o novo sha, ou null se falhar. */
  async function persistProject(): Promise<string | null> {
    if (!project || !sha) return null;
    const res = await fetch(`/api/projects/${repo}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ project, sha }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Erro ao salvar projeto.");
    setSha(data.sha);
    return data.sha;
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      await persistProject();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function handleExport() {
    setExporting(true);
    setExportResult(null);
    setError(null);
    try {
      // A exportação lê o project.json persistido, não o estado em memória —
      // salva primeiro pra garantir que reflete o que está no canvas agora.
      await persistProject();
      const res = await fetch(`/api/projects/${repo}/export`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao exportar projeto.");
      setExportResult(data.paths);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setExporting(false);
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
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => setCollectionsModalOpen(true)}
              style={{
                padding: "8px 16px",
                background: "#fff",
                color: "#333",
                border: "1px solid #ddd",
                borderRadius: 6,
                cursor: "pointer",
              }}
            >
              Coleções
            </button>
            <button
              onClick={handleExport}
              disabled={exporting}
              style={{
                padding: "8px 16px",
                background: "#fff",
                color: "#333",
                border: "1px solid #ddd",
                borderRadius: 6,
                cursor: "pointer",
              }}
            >
              {exporting ? "Exportando…" : "Exportar"}
            </button>
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
          </div>
        </header>

        {exportResult && (
          <div
            style={{
              background: "#eef7ee",
              borderBottom: "1px solid #cde5cd",
              padding: "8px 16px",
              fontSize: 12,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 12,
            }}
          >
            <span>
              Exportado: {exportResult.length} arquivo(s) em <code>export/site</code> e{" "}
              <code>export/component</code> no repositório do projeto.
            </span>
            <button
              onClick={() => setExportResult(null)}
              style={{ border: "none", background: "none", cursor: "pointer", color: "#555" }}
            >
              ×
            </button>
          </div>
        )}

        <div style={{ flex: 1, overflow: "auto" }}>
          <Canvas
            root={root}
            breakpoints={project.breakpoints}
            activeBreakpointId={activeBreakpointId}
            selectedId={selectedId}
            onSelect={setSelectedId}
            collections={project.collections ?? {}}
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
          onChangeAnimations={handleChangeAnimations}
          onDelete={handleDelete}
          activeBreakpointId={activeBreakpointId}
          collections={project.collections ?? {}}
          activeCollection={activeCollection}
        />
      </aside>
    </div>
    {collectionsModalOpen && (
      <CollectionsManager
        collections={project.collections ?? {}}
        onChange={(next) => setProject({ ...project, collections: next })}
        onClose={() => setCollectionsModalOpen(false)}
        initialSelectedId={activeCollectionId}
      />
    )}
    </DndContext>
  );
}
