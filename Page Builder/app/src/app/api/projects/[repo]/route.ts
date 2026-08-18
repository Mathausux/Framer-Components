import { NextRequest, NextResponse } from "next/server";
import { getProjectFile, saveProjectFile } from "@/lib/github";
import { PageBuilderProject } from "@/lib/schema";

export async function GET(_request: NextRequest, { params }: { params: { repo: string } }) {
  try {
    const { project, sha } = await getProjectFile(params.repo);
    return NextResponse.json({ project, sha });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { repo: string } }) {
  try {
    const body = await request.json();
    const { project, sha } = body as { project?: PageBuilderProject; sha?: string };

    if (!project || !sha) {
      return NextResponse.json(
        { error: "Campos obrigatórios ausentes: project, sha." },
        { status: 400 }
      );
    }

    const result = await saveProjectFile(params.repo, project, sha);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
