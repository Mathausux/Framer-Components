import { NextRequest, NextResponse } from "next/server";
import { getStore } from "@/lib/store";
import { generateSiteFiles } from "@/lib/codegen/exportSite";
import { generateComponentFiles } from "@/lib/codegen/exportComponent";

export async function POST(_request: NextRequest, { params }: { params: { repo: string } }) {
  try {
    const store = getStore();
    const { project } = await store.getProject(params.repo);

    const siteFiles = generateSiteFiles(project);
    const componentFiles = generateComponentFiles(project);

    const { paths: sitePaths } = await store.writeFiles(params.repo, "export/site", siteFiles);
    const { paths: componentPaths } = await store.writeFiles(
      params.repo,
      "export/component",
      componentFiles
    );

    return NextResponse.json({ paths: [...sitePaths, ...componentPaths] });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
