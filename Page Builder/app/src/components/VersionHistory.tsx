"use client";

import { CSSProperties, useEffect, useState } from "react";

export interface VersionInfo {
  id: string;
  message: string;
  date: string;
}

export interface VersionHistoryProps {
  repo: string;
  onClose: () => void;
  onRestore: (versionId: string) => Promise<void> | void;
}

export function VersionHistory({ repo, onClose, onRestore }: VersionHistoryProps) {
  const [versions, setVersions] = useState<VersionInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [restoringId, setRestoringId] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/projects/${repo}/versions`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setVersions(data.versions);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [repo]);

  async function handleRestore(id: string) {
    setRestoringId(id);
    try {
      await onRestore(id);
      onClose();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setRestoringId(null);
    }
  }

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ fontSize: 16, margin: 0 }}>Histórico de versões</h2>
          <button onClick={onClose} style={closeButtonStyle}>
            Fechar
          </button>
        </div>

        {loading && <p style={{ fontSize: 13, color: "#999" }}>Carregando…</p>}
        {error && <p style={{ fontSize: 13, color: "#c0392b" }}>{error}</p>}

        {!loading && !error && versions.length === 0 && (
          <p style={{ fontSize: 13, color: "#999" }}>Nenhuma versão salva ainda.</p>
        )}

        <ul style={{ listStyle: "none", padding: 0, margin: "12px 0 0" }}>
          {versions.map((v, index) => (
            <li
              key={v.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "10px 4px",
                borderBottom: "1px solid #f0f0f0",
                gap: 12,
              }}
            >
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13 }}>
                  {new Date(v.date).toLocaleString("pt-BR")}
                  {index === 0 && (
                    <span style={{ marginLeft: 8, fontSize: 11, color: "#0070f3" }}>(mais recente)</span>
                  )}
                </div>
                <div style={{ fontSize: 12, color: "#999", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {v.message}
                </div>
              </div>
              <button
                onClick={() => handleRestore(v.id)}
                disabled={index === 0 || restoringId !== null}
                style={smallButtonStyle}
              >
                {restoringId === v.id ? "Restaurando…" : "Restaurar"}
              </button>
            </li>
          ))}
        </ul>
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
  width: "min(520px, 90vw)",
  maxHeight: "80vh",
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
  whiteSpace: "nowrap",
};
