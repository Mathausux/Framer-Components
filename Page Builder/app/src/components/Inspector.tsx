"use client";

import { CSSProperties, useEffect, useState } from "react";
import { Node } from "@/lib/schema";
import { NODE_TYPE_LABELS } from "@/lib/nodeRenderer";

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

      <StylesEditor
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

  return null;
}

function StylesEditor({
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
    <label style={fieldLabelStyle}>
      Estilos ({activeBreakpointId}, JSON)
      <textarea
        style={{ ...fieldInputStyle, minHeight: 120, fontFamily: "monospace", fontSize: 12 }}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={handleBlur}
      />
      {error && <span style={{ color: "#c0392b", fontSize: 12 }}>{error}</span>}
    </label>
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
