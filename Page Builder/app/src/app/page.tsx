"use client";

import { useEffect, useState } from "react";

interface ProjectSummary {
  repo: string;
  name: string;
  description: string | null;
  updatedAt: string;
  htmlUrl: string;
}

export default function HomePage() {
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);
  const [storage, setStorage] = useState<"github" | "local" | null>(null);

  useEffect(() => {
    fetch("/api/config")
      .then((res) => res.json())
      .then((data) => setStorage(data.storage))
      .catch(() => setStorage(null));
  }, []);

  async function loadProjects() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/projects");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao listar projetos.");
      setProjects(data.projects);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProjects();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    const projectId = name
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    setCreating(true);
    setError(null);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, name: name.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao criar projeto.");
      setName("");
      await loadProjects();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setCreating(false);
    }
  }

  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: "48px 24px" }}>
      <h1 style={{ fontSize: 28, marginBottom: 4 }}>Page Builder</h1>
      <p style={{ color: "#555", marginTop: 0 }}>
        Fase 0 e 1 — cada projeto é um repositório GitHub próprio.
      </p>

      {storage === "local" && (
        <p
          style={{
            background: "#fff8e1",
            border: "1px solid #ffe082",
            padding: 12,
            borderRadius: 4,
            fontSize: 13,
          }}
        >
          Modo local ativo: GITHUB_TOKEN/GITHUB_OWNER não configurados, então os
          projetos estão sendo salvos em disco (<code>.local-projects/</code>) só
          para desenvolvimento/testes — nada é enviado ao GitHub.
        </p>
      )}

      <form onSubmit={handleCreate} style={{ display: "flex", gap: 8, margin: "24px 0" }}>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nome do novo projeto"
          style={{ flex: 1, padding: "8px 12px", fontSize: 16 }}
        />
        <button type="submit" disabled={creating} style={{ padding: "8px 16px" }}>
          {creating ? "Criando…" : "Criar projeto"}
        </button>
      </form>

      {error && (
        <p style={{ color: "#c0392b", background: "#fdecea", padding: 12, borderRadius: 4 }}>
          {error}
        </p>
      )}

      {loading ? (
        <p>Carregando projetos…</p>
      ) : projects.length === 0 ? (
        <p style={{ color: "#777" }}>Nenhum projeto ainda.</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0 }}>
          {projects.map((p) => (
            <li
              key={p.repo}
              style={{
                border: "1px solid #e5e5e5",
                borderRadius: 8,
                padding: 16,
                marginBottom: 12,
              }}
            >
              <strong>{p.name}</strong>
              <div style={{ fontSize: 13, color: "#777" }}>
                Atualizado em {new Date(p.updatedAt).toLocaleString("pt-BR")}
              </div>
              <div style={{ display: "flex", gap: 12, marginTop: 4 }}>
                <a href={`/projects/${p.repo}`} style={{ fontSize: 13 }}>
                  Abrir editor →
                </a>
                <a href={p.htmlUrl} target="_blank" rel="noreferrer" style={{ fontSize: 13 }}>
                  Ver no GitHub →
                </a>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
