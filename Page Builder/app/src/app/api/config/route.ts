import { NextResponse } from "next/server";

export async function GET() {
  const storage = process.env.GITHUB_TOKEN && process.env.GITHUB_OWNER ? "github" : "local";
  return NextResponse.json({ storage });
}
