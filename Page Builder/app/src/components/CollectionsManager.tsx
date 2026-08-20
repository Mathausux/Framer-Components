"use client";

import { CSSProperties, useState } from "react";
import { Collection, CollectionFieldType } from "@/lib/schema";
import {
  addField,
  addItem,
  createCollection,
  removeField,
  removeItem,
  renameCollection,
  updateItemField,
} from "@/lib/collections";

export interface CollectionsManagerProps {
  collections: Record<string, Collection>;
  onChange: (collections: Record<string, Collection>) => void;
  onClose: () => void;
  initialSelectedId?: string;
}

const FIELD_TYPES: [CollectionFieldType, string][] = [
  ["text", "Texto"],
  ["richText", "Texto longo"],
  ["number", "Número"],
  ["boolean", "Booleano"],
  ["date", "Data"],
  ["image", "Imagem (URL)"],
  ["url", "Link (URL)"],
];

export function CollectionsManager({
  collections,
  onChange,
  onClose,
  initialSelectedId,
}: CollectionsManagerProps) {
  const ids = Object.keys(collections);
  const [selectedId, setSelectedId] = useState<string | null>(initialSelectedId ?? ids[0] ?? null);
  const [newFieldLabel, setNewFieldLabel] = useState("");
  const [newFieldType, setNewFieldType] = useState<CollectionFieldType>("text");

  const selected = selectedId ? collections[selectedId] : undefined;

  function updateSelected(next: Collection) {
    onChange({ ...collections, [next.id]: next });
  }

  function handleCreateCollection() {
    const name = window.prompt("Nome da nova coleção:");
    if (!name?.trim()) return;
    const collection = createCollection(name.trim());
    onChange({ ...collections, [collection.id]: collection });
    setSelectedId(collection.id);
  }

  function handleDeleteCollection(id: string) {
    if (!window.confirm("Excluir esta coleção? Nós vinculados a ela ficarão sem dados.")) return;
    const next = { ...collections };
    delete next[id];
    onChange(next);
    if (selectedId === id) setSelectedId(Object.keys(next)[0] ?? null);
  }

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ fontSize: 16, margin: 0 }}>Coleções (CMS)</h2>
          <button onClick={onClose} style={closeButtonStyle}>
            Fechar
          </button>
        </div>

        <div style={{ display: "flex", gap: 16, marginTop: 16, minHeight: 320 }}>
          <div style={{ width: 180, borderRight: "1px solid #eee", paddingRight: 12 }}>
            <button onClick={handleCreateCollection} style={{ ...smallButtonStyle, width: "100%" }}>
              + Nova coleção
            </button>
            <ul style={{ listStyle: "none", padding: 0, marginTop: 8 }}>
              {ids.map((id) => (
                <li key={id}>
                  <button
                    onClick={() => setSelectedId(id)}
                    style={{
                      ...listItemButtonStyle,
                      background: id === selectedId ? "#eef4ff" : "transparent",
                      fontWeight: id === selectedId ? 600 : 400,
                    }}
                  >
                    {collections[id].name}
                  </button>
                </li>
              ))}
              {ids.length === 0 && (
                <li style={{ fontSize: 12, color: "#999", padding: "8px 4px" }}>Nenhuma coleção ainda.</li>
              )}
            </ul>
          </div>

          <div style={{ flex: 1, overflowX: "auto" }}>
            {!selected ? (
              <p style={{ fontSize: 13, color: "#999" }}>Selecione ou crie uma coleção.</p>
            ) : (
              <>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <input
                    style={{ ...inputStyle, fontSize: 15, fontWeight: 600, border: "none", padding: "2px 0" }}
                    value={selected.name}
                    onChange={(e) => updateSelected(renameCollection(selected, e.target.value))}
                  />
                  <button
                    onClick={() => handleDeleteCollection(selected.id)}
                    style={{ ...smallButtonStyle, color: "#c0392b" }}
                  >
                    Excluir coleção
                  </button>
                </div>

                <div style={{ display: "flex", gap: 8, alignItems: "flex-end", marginTop: 12 }}>
                  <label style={{ fontSize: 12, color: "#555" }}>
                    Novo campo
                    <input
                      style={inputStyle}
                      value={newFieldLabel}
                      onChange={(e) => setNewFieldLabel(e.target.value)}
                      placeholder="ex: Imagem de capa"
                    />
                  </label>
                  <select
                    style={inputStyle}
                    value={newFieldType}
                    onChange={(e) => setNewFieldType(e.target.value as CollectionFieldType)}
                  >
                    {FIELD_TYPES.map(([v, l]) => (
                      <option key={v} value={v}>
                        {l}
                      </option>
                    ))}
                  </select>
                  <button
                    style={smallButtonStyle}
                    onClick={() => {
                      if (!newFieldLabel.trim()) return;
                      updateSelected(addField(selected, newFieldLabel.trim(), newFieldType));
                      setNewFieldLabel("");
                    }}
                  >
                    + Campo
                  </button>
                </div>

                <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 16, fontSize: 13 }}>
                  <thead>
                    <tr>
                      {selected.fields.map((field) => (
                        <th key={field.id} style={thStyle}>
                          {field.label}
                          <button
                            onClick={() => updateSelected(removeField(selected, field.id))}
                            style={{ ...smallButtonStyle, marginLeft: 4, padding: "0 4px" }}
                            title="Remover campo"
                          >
                            ×
                          </button>
                        </th>
                      ))}
                      <th style={thStyle} />
                    </tr>
                  </thead>
                  <tbody>
                    {selected.items.map((item, index) => (
                      <tr key={index}>
                        {selected.fields.map((field) => (
                          <td key={field.id} style={tdStyle}>
                            {field.type === "boolean" ? (
                              <input
                                type="checkbox"
                                checked={Boolean(item[field.id])}
                                onChange={(e) =>
                                  updateSelected(updateItemField(selected, index, field.id, e.target.checked))
                                }
                              />
                            ) : (
                              <input
                                type={field.type === "number" ? "number" : "text"}
                                style={inputStyle}
                                value={(item[field.id] as string | number | undefined) ?? ""}
                                onChange={(e) =>
                                  updateSelected(
                                    updateItemField(
                                      selected,
                                      index,
                                      field.id,
                                      field.type === "number" ? Number(e.target.value) : e.target.value
                                    )
                                  )
                                }
                              />
                            )}
                          </td>
                        ))}
                        <td style={tdStyle}>
                          <button
                            onClick={() => updateSelected(removeItem(selected, index))}
                            style={smallButtonStyle}
                          >
                            Remover
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <button
                  style={{ ...smallButtonStyle, marginTop: 8 }}
                  onClick={() => updateSelected(addItem(selected))}
                >
                  + Item
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const overlayStyle: CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.4)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 1000,
};

const modalStyle: CSSProperties = {
  background: "#fff",
  borderRadius: 8,
  padding: 20,
  width: "min(900px, 90vw)",
  maxHeight: "85vh",
  overflowY: "auto",
};

const closeButtonStyle: CSSProperties = {
  padding: "6px 12px",
  border: "1px solid #ddd",
  borderRadius: 6,
  background: "#fff",
  cursor: "pointer",
};

const smallButtonStyle: CSSProperties = {
  padding: "6px 10px",
  fontSize: 12,
  border: "1px solid #ddd",
  borderRadius: 6,
  background: "#fff",
  cursor: "pointer",
};

const listItemButtonStyle: CSSProperties = {
  display: "block",
  width: "100%",
  textAlign: "left",
  padding: "6px 8px",
  border: "none",
  borderRadius: 4,
  cursor: "pointer",
  fontSize: 13,
};

const inputStyle: CSSProperties = {
  padding: "4px 6px",
  fontSize: 13,
  border: "1px solid #ddd",
  borderRadius: 4,
  fontFamily: "inherit",
};

const thStyle: CSSProperties = {
  textAlign: "left",
  padding: "4px 8px",
  borderBottom: "1px solid #eee",
  whiteSpace: "nowrap",
};

const tdStyle: CSSProperties = {
  padding: "4px 8px",
  borderBottom: "1px solid #f5f5f5",
};
