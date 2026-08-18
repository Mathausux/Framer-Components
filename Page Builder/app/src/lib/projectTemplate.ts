import { PageBuilderProject, SCHEMA_VERSION } from "./schema";

/**
 * Gera o project.json inicial de um projeto novo.
 */
export function createInitialProject(projectId: string, name: string): PageBuilderProject {
  const now = new Date().toISOString();

  return {
    schemaVersion: SCHEMA_VERSION,
    projectId,
    name,
    createdAt: now,
    updatedAt: now,
    breakpoints: [
      { id: "desktop", label: "Desktop", maxWidth: null },
      { id: "tablet", label: "Tablet", maxWidth: 810 },
      { id: "mobile", label: "Mobile", maxWidth: 390 },
    ],
    designTokens: {
      colors: {
        background: "#ffffff",
        text: "#111111",
        primary: "#0070f3",
      },
      spacing: {
        sm: 8,
        md: 16,
        lg: 32,
      },
      typography: {
        body: { fontFamily: "system-ui, sans-serif", fontSize: 16, lineHeight: 1.5 },
        heading: { fontFamily: "system-ui, sans-serif", fontSize: 32, fontWeight: 700, lineHeight: 1.2 },
      },
    },
    collections: {},
    componentLibrary: [],
    pages: [
      {
        id: "home",
        path: "/",
        title: name,
        seo: { title: name, description: "" },
        root: {
          id: "root",
          type: "frame",
          name: "Página",
          props: {},
          styles: {
            desktop: { display: "flex", flexDirection: "column", padding: 32 },
          },
          children: [
            {
              id: "heading-1",
              type: "text",
              name: "Título",
              props: { content: `Bem-vindo ao ${name}` },
              styles: { desktop: { fontSize: 32, fontWeight: 700 } },
            },
          ],
        },
      },
    ],
  };
}
