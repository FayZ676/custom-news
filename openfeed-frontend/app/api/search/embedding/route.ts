import { NextResponse } from "next/server";

import { embedText } from "@/lib/embeddings";

export async function POST(request: Request) {
  const { query } = await request.json().catch(() => ({}));
  if (typeof query !== "string" || query.trim().length === 0) {
    return NextResponse.json({ error: "query is required" }, { status: 400 });
  }

  const embedding = await embedText(query.trim());
  if (!embedding) {
    return NextResponse.json(
      { error: "failed to embed query" },
      { status: 502 },
    );
  }

  return NextResponse.json({ embedding });
}
