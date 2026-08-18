"use client";

import { CSSProperties, useEffect, useState } from "react";
import { Node } from "@/lib/schema";
import { NODE_TYPE_LABELS } from "@/lib/nodeRenderer";
import { EditablePropField, getComponentLibraryEntry } from "@/lib/componentLibrary";
import { StyleEditor } from "./StyleEditor";

export interface InspectorProps {
  node: Node | null;
  isRoot: boolean;
  onChangeProps: (nodeId: string, props: Record<string, unknown>) => void;
  onChangeStyles: (nodeId: string, breakpointId: string, styles: Record<string, unknown>) => void;
  onChangeName: (nodeId: string, name: string) => void;
  onDelete: (nodeId: string) => void;
  activeBreakpointId: string;
}

export function Inspector({
  node,
  isRoot,
  onChangeProps,
  onChangeStyles,
  onChangeName,
  onDelete,
  activeBreakpointId,
}: InspectorProps) {
  if (!node) {
    return <p style={{ fontSize: 13, color: "#999" }}>Selecione um bloco no canvas.</p>;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div>
        <h3 style={{ fontSize: 13, textTransform: "uppercase", color: "#777", margin: "0 0 4px" }}>
          {NODE_TYPE_LABELS[node.type]}
        </h3>
        <label style={fieldLabelStyle}>
          Nome
          <input
            style={fieldInputStyle}
            value={node.name ?? ""}
            onChange={(e) => onChangeName(node.id, e.target.value)}
          />
        </label>
      </div>

      <PropsFields node={node} onChangeProps={onChangeProps} />

      <div>
        <h4 style={{ fontSize: 11, textTransform: "uppercase", color: "#999", margin: "0 0 8px" }}>
          Estilos ({activeBreakpointId})
        </h4>
        <StyleEditor
          nodeType={node.type}
          styles={node.styles?.[activeBreakpointId] ?? {}}
          onChange={(styles) => onChangeStyles(node.id, activeBreakpointId, styles)}
        />
      </div>

      <AdvancedStylesEditor
        node={node}
        activeBreakpointId={activeBreakpointId}
        onChangeStyles={onChangeStyles}
      />

      {!isRoot && (
        <button
          onClick={() => onDelete(node.id)}
          style={{
            padding: "6px 12px",
            background: "#fdecea",
            color: "#c0392b",
            border: "1px solid #f5c6cb",
            borderRadius: 6,
            cursor: "pointer",
          }}
        >
          Excluir bloco
        </button>
      )}
    </div>
  );
}

function PropsFields({
  node,
  onChangeProps,
}: {
  node: Node;
  onChangeProps: (nodeId: string, props: Record<string, unknown>) => void;
}) {
  const props = node.props ?? {};

  if (node.type === "text") {
    return (
      <label style={fieldLabelStyle}>
        Conteúdo
        <textarea
          style={{ ...fieldInputStyle, minHeight: 60 }}
          value={(props.content as string) ?? ""}
          onChange={(e) => onChangeProps(node.id, { ...props, content: e.target.value })}
        />
      </label>
    );
  }

  if (node.type === "image") {
    return (
      <>
        <label style={fieldLabelStyle}>
          URL da imagem
          <input
            style={fieldInputStyle}
            value={(props.src as string) ?? ""}
            onChange={(e) => onChangeProps(node.id, { ...props, src: e.target.value })}
          />
        </label>
        <label style={fieldLabelStyle}>
          Texto alternativo
          <input
            style={fieldInputStyle}
            value={(props.alt as string) ?? ""}
            onChange={(e) => onChangeProps(node.id, { ...props, alt: e.target.value })}
          />
        </label>
      </>
    );
  }

  if (node.type === "button") {
    return (
      <label style={fieldLabelStyle}>
        Rótulo
        <input
          style={fieldInputStyle}
          value={(props.label as string) ?? ""}
          onChange={(e) => onChangeProps(node.id, { ...props, label: e.target.value })}
        />
      </label>
    );
  }

  if (node.type === "component-ref") {
    return <ComponentRefFields node={node} onChangeProps={onChangeProps} />;
  }

  return null;
}

interface GalleryImage {
  src: string;
  alt?: string;
}

function ComponentRefFields({
  node,
  onChangeProps,
}: {
  node: Node;
  onChangeProps: (nodeId: string, props: Record<string, unknown>) => void;
}) {
  const props = node.props ?? {};
  const componentId = props.componentId as string | undefined;
  const entry = componentId ? getComponentLibraryEntry(componentId) : undefined;

  if (!entry) {
    return (
      <p style={{ fontSize: 12, color: "#c0392b" }}>
        Componente não encontrado: {componentId ?? "(sem componentId)"}
      </p>
    );
  }

  const componentProps = (props.componentProps as Record<string, unknown>) ?? {};

  function setComponentProp(key: string, value: unknown) {
    onChangeProps(node.id, {
      ...props,
      componentProps: { ...componentProps, [key]: value },
    });
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <p style={{ fontSize: 11, color: "#999", margin: 0 }}>{entry.description}</p>
      {entry.editableProps.map((field) => (
        <ComponentPropField
          key={field.key}
          field={field}
          value={componentProps[field.key]}
          onChange={(v) => setComponentProp(field.key, v)}
        />
      ))}
    </div>
  );
}

function ComponentPropField({
  field,
  value,
  onChange,
}: {
  field: EditablePropField;
  value: unknown;
  onChange: (value: unknown) => void;
}) {
  if (field.kind === "boolean") {
    return (
      <label style={{ ...fieldLabelStyle, flexDirection: "row", alignItems: "center", gap: 8 }}>
        <input type="checkbox" checked={Boolean(value)} onChange={(e) => onChange(e.target.checked)} />
        {field.label}
      </label>
    );
  }

  if (field.kind === "number") {
    return (
      <label style={fieldLabelStyle}>
        {field.label}
        <input
          type="number"
          style={fieldInputStyle}
          min={field.min}
          max={field.max}
          step={field.step}
          value={typeof value === "number" ? value : ""}
          onChange={(e) => onChange(e.target.value === "" ? undefined : Number(e.target.value))}
        />
      </label>
    );
  }

  if (field.kind === "color") {
    return (
      <label style={fieldLabelStyle}>
        {field.label}
        <input
          type="text"
          style={fieldInputStyle}
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onChange(e.target.value)}
        />
      </label>
    );
  }

  if (field.kind === "select") {
    return (
      <label style={fieldLabelStyle}>
        {field.label}
        <select
          style={fieldInputStyle}
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onChange(e.target.value)}
        >
          {field.options.map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
      </label>
    );
  }

  // imageList: guarda como GalleryImage[] ({src}), edição como uma URL por linha.
  const images = Array.isArray(value) ? (value as GalleryImage[]) : [];
  const text = images.map((img) => img.src).join("\n");

  return (
    <label style={fieldLabelStyle}>
      {field.label}
      <textarea
        style={{ ...fieldInputStyle, minHeight: 80 }}
        defaultValue={text}
        onBlur={(e) =>
          onChange(
            e.target.value
              .split("\n")
              .map((line) => line.trim())
              .filter(Boolean)
              .map((src) => ({ src }))
          )
        }
      />
    </label>
  );
}

/**
 * Escape hatch para propriedades CSS que o StyleEditor visual ainda não
 * cobre (ex: boxShadow, border completo, transform). O StyleEditor é a via
 * principal de edição; isto fica escondido atrás de um <details>.
 */
function AdvancedStylesEditor({
  node,
  activeBreakpointId,
  onChangeStyles,
}: {
  node: Node;
  activeBreakpointId: string;
  onChangeStyles: (nodeId: string, breakpointId: string, styles: Record<string, unknown>) => void;
}) {
  const currentStyles = node.styles?.[activeBreakpointId] ?? {};
  const [text, setText] = useState(JSON.stringify(currentStyles, null, 2));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setText(JSON.stringify(node.styles?.[activeBreakpointId] ?? {}, null, 2));
    setError(null);
  }, [node.id, activeBreakpointId, node.styles]);

  function handleBlur() {
    try {
      const parsed = JSON.parse(text);
      setError(null);
      onChangeStyles(node.id, activeBreakpointId, parsed);
    } catch {
      setError("JSON inválido — a última edição válida foi mantida.");
    }
  }

  return (
    <details>
      <summary style={{ fontSize: 12, color: "#777", cursor: "pointer" }}>
        Avançado: editar estilos como JSON
      </summary>
      <label style={{ ...fieldLabelStyle, marginTop: 8 }}>
        Estilos ({activeBreakpointId}, JSON)
        <textarea
          style={{ ...fieldInputStyle, minHeight: 120, fontFamily: "monospace", fontSize: 12 }}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onBlur={handleBlur}
        />
        {error && <span style={{ color: "#c0392b", fontSize: 12 }}>{error}</span>}
      </label>
    </details>
  );
}

const fieldLabelStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 4,
  fontSize: 12,
  color: "#555",
};

const fieldInputStyle: CSSProperties = {
  padding: "6px 8px",
  fontSize: 14,
  border: "1px solid #ddd",
  borderRadius: 4,
  fontFamily: "inherit",
};
