import { NextRequest, NextResponse } from "next/server";
import { getStore } from "@/lib/store";

// Sem parâmetros de request dinâmicos (query/cookies/headers), o Next.js
// trataria este GET como estático e cachearia a primeira resposta — errado
// aqui, já que o histórico muda a cada salvamento.
export const dynamic = "force-dynamic";

export async function GET(_request: NextRequest, { params }: { params: { repo: string } }) {
  try {
    const versions = await getStore().listVersions(params.repo);
    return NextResponse.json({ versions });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
