import { NextRequest, NextResponse } from "next/server";
import { getStore } from "@/lib/store";
import { createInitialProject } from "@/lib/projectTemplate";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const projects = await getStore().listProjects();
    return NextResponse.json({ projects });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId, name } = body as { projectId?: string; name?: string };

    if (!projectId || !name) {
      return NextResponse.json(
        { error: "Campos obrigatórios ausentes: projectId, name." },
        { status: 400 }
      );
    }

    if (!/^[a-z0-9-]+$/.test(projectId)) {
      return NextResponse.json(
        { error: "projectId deve conter apenas letras minúsculas, números e hífens." },
        { status: 400 }
      );
    }

    const project = createInitialProject(projectId, name);
    const summary = await getStore().createProject(projectId, project);

    return NextResponse.json({ project: summary }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
