import { NextRequest, NextResponse } from "next/server";
import { getStore } from "@/lib/store";
import { PageBuilderProject } from "@/lib/schema";

export const dynamic = "force-dynamic";

export async function GET(_request: NextRequest, { params }: { params: { repo: string } }) {
  try {
    const { project, sha, htmlUrl } = await getStore().getProject(params.repo);
    return NextResponse.json({ project, sha, htmlUrl });
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

    const result = await getStore().saveProject(params.repo, project, sha);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
