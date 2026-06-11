import { NextResponse } from "next/server";

// Must match the model and dimensions used to embed articles at ingestion
// (openfeed-backend OpenAIClient defaults).
const EMBEDDING_MODEL = "text-embedding-3-large";
const EMBEDDING_DIMENSIONS = 512;

export async function POST(request: Request) {
  const { query } = await request.json().catch(() => ({}));
  if (typeof query !== "string" || query.trim().length === 0) {
    return NextResponse.json({ error: "query is required" }, { status: 400 });
  }

  const response = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: EMBEDDING_MODEL,
      input: query.trim(),
      dimensions: EMBEDDING_DIMENSIONS,
    }),
  });

  if (!response.ok) {
    return NextResponse.json(
      { error: "failed to embed query" },
      { status: 502 },
    );
  }

  const data = await response.json();
  return NextResponse.json({ embedding: data.data[0].embedding });
}
