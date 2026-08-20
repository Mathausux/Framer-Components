import { NextRequest, NextResponse } from "next/server";
import { getStore } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: { repo: string; versionId: string } }
) {
  try {
    const project = await getStore().getVersionContent(params.repo, params.versionId);
    return NextResponse.json({ project });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
