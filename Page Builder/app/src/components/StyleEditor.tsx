"use client";

import { CSSProperties, ReactNode } from "react";
import { NodeType } from "@/lib/schema";

export interface StyleEditorProps {
  nodeType: NodeType;
  styles: Record<string, unknown>;
  onChange: (styles: Record<string, unknown>) => void;
}

const CONTAINER_TYPES: NodeType[] = ["frame", "cms-collection", "form"];
const TEXT_LIKE_TYPES: NodeType[] = ["text", "button"];

/**
 * Editor visual dos estilos de um nó para o breakpoint ativo. Cobre as
 * propriedades mais comuns (layout, espaçamento, dimensões, tipografia,
 * aparência); qualquer outra propriedade CSS presente no objeto de estilos
 * (definida via o editor JSON avançado) é preservada mesmo sem campo visual.
 */
export function StyleEditor({ nodeType, styles, onChange }: StyleEditorProps) {
  function set(key: string, value: string | number | undefined) {
    const next = { ...styles };
    if (value === undefined || value === "") {
      delete next[key];
    } else {
      next[key] = value;
    }
    onChange(next);
  }

  const isContainer = CONTAINER_TYPES.includes(nodeType);
  const isTextLike = TEXT_LIKE_TYPES.includes(nodeType);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {isContainer && (
        <FieldGroup title="Layout">
          <SelectField
            label="Direção"
            value={styles.flexDirection as string}
            onChange={(v) => set("flexDirection", v)}
            options={[
              ["row", "Linha"],
              ["column", "Coluna"],
            ]}
          />
          <SelectField
            label="Alinhar (eixo principal)"
            value={styles.justifyContent as string}
            onChange={(v) => set("justifyContent", v)}
            options={[
              ["flex-start", "Início"],
              ["center", "Centro"],
              ["flex-end", "Fim"],
              ["space-between", "Espaçado"],
            ]}
          />
          <SelectField
            label="Alinhar (eixo cruzado)"
            value={styles.alignItems as string}
            onChange={(v) => set("alignItems", v)}
            options={[
              ["stretch", "Esticar"],
              ["flex-start", "Início"],
              ["center", "Centro"],
              ["flex-end", "Fim"],
            ]}
          />
          <NumberField label="Espaço entre itens" value={styles.gap as number} onChange={(v) => set("gap", v)} />
        </FieldGroup>
      )}

      <FieldGroup title="Espaçamento">
        <NumberField label="Padding" value={styles.padding as number} onChange={(v) => set("padding", v)} />
      </FieldGroup>

      <FieldGroup title="Dimensões">
        <TextField
          label="Largura"
          value={styles.width as string}
          onChange={(v) => set("width", v)}
          placeholder="ex: 100%, 320px"
        />
        <TextField
          label="Altura"
          value={styles.height as string}
          onChange={(v) => set("height", v)}
          placeholder="ex: auto, 200px"
        />
      </FieldGroup>

      {isTextLike && (
        <FieldGroup title="Tipografia">
          <NumberField
            label="Tamanho da fonte"
            value={styles.fontSize as number}
            onChange={(v) => set("fontSize", v)}
          />
          <SelectField
            label="Peso"
            value={styles.fontWeight != null ? String(styles.fontWeight) : ""}
            onChange={(v) => set("fontWeight", v ? Number(v) : undefined)}
            options={[
              ["400", "Normal"],
              ["500", "Médio"],
              ["600", "Semi-negrito"],
              ["700", "Negrito"],
              ["800", "Extra-negrito"],
            ]}
          />
          <ColorField label="Cor do texto" value={styles.color as string} onChange={(v) => set("color", v)} />
          <SelectField
            label="Alinhamento"
            value={styles.textAlign as string}
            onChange={(v) => set("textAlign", v)}
            options={[
              ["left", "Esquerda"],
              ["center", "Centro"],
              ["right", "Direita"],
            ]}
          />
        </FieldGroup>
      )}

      <FieldGroup title="Aparência">
        <ColorField
          label="Cor de fundo"
          value={styles.background as string}
          onChange={(v) => set("background", v)}
        />
        <NumberField
          label="Cantos arredondados"
          value={styles.borderRadius as number}
          onChange={(v) => set("borderRadius", v)}
        />
      </FieldGroup>
    </div>
  );
}

function FieldGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <h4 style={{ fontSize: 11, textTransform: "uppercase", color: "#999", margin: "0 0 8px" }}>{title}</h4>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>{children}</div>
    </div>
  );
}

function NumberField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number | undefined;
  onChange: (value: number | undefined) => void;
}) {
  return (
    <label style={fieldLabelStyle}>
      {label}
      <input
        type="number"
        style={fieldInputStyle}
        value={value ?? ""}
        placeholder="herdado"
        onChange={(e) => onChange(e.target.value === "" ? undefined : Number(e.target.value))}
      />
    </label>
  );
}

function TextField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string | undefined;
  onChange: (value: string | undefined) => void;
  placeholder?: string;
}) {
  return (
    <label style={fieldLabelStyle}>
      {label}
      <input
        type="text"
        style={fieldInputStyle}
        value={value ?? ""}
        placeholder={placeholder ?? "herdado"}
        onChange={(e) => onChange(e.target.value === "" ? undefined : e.target.value)}
      />
    </label>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string | undefined;
  onChange: (value: string | undefined) => void;
  options: [string, string][];
}) {
  return (
    <label style={fieldLabelStyle}>
      {label}
      <select
        style={fieldInputStyle}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value === "" ? undefined : e.target.value)}
      >
        <option value="">(herdado)</option>
        {options.map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
    </label>
  );
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string | undefined;
  onChange: (value: string | undefined) => void;
}) {
  const isValidHex = /^#[0-9a-fA-F]{3,8}$/.test(value ?? "");

  return (
    <label style={fieldLabelStyle}>
      {label}
      <div style={{ display: "flex", gap: 8 }}>
        <input
          type="color"
          value={isValidHex ? value : "#000000"}
          onChange={(e) => onChange(e.target.value)}
          style={{ width: 36, height: 32, padding: 0, border: "1px solid #ddd", borderRadius: 4 }}
        />
        <input
          type="text"
          style={{ ...fieldInputStyle, flex: 1 }}
          value={value ?? ""}
          placeholder="herdado"
          onChange={(e) => onChange(e.target.value === "" ? undefined : e.target.value)}
        />
      </div>
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
