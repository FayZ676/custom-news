// @ts-nocheck

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY")!;
const MODEL = "text-embedding-3-small";
const DIMENSIONS = 512;

// ─── Types ──────────────────────────────────────────────────

interface OpenAIEmbeddingData {
  object: string;
  index: number;
  embedding: number[];
}

interface OpenAIEmbeddingResponse {
  object: string;
  data: OpenAIEmbeddingData[];
  model: string;
  usage: { prompt_tokens: number; total_tokens: number };
}

// ─── OpenAI call ────────────────────────────────────────────

export async function embed(texts: string[]): Promise<{
  embeddings: number[][];
  model: string;
}> {
  const res = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      input: texts,
      model: MODEL,
      dimensions: DIMENSIONS,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`OpenAI API error (${res.status}): ${body}`);
  }

  const json: OpenAIEmbeddingResponse = await res.json();

  // Sort by index to guarantee order matches input
  const sorted = json.data.sort((a, b) => a.index - b.index);

  return {
    embeddings: sorted.map((d) => d.embedding),
    model: json.model,
  };
}

// ─── Handler ────────────────────────────────────────────────

Deno.serve(async (req) => {
  try {
    const { input } = await req.json();

    if (!input) {
      return Response.json({ error: "Missing 'input'" }, { status: 400 });
    }

    // Accept both a single string and an array of strings
    const texts: string[] = Array.isArray(input) ? input : [input];

    if (texts.length === 0) {
      return Response.json(
        { error: "'input' must not be empty" },
        { status: 400 },
      );
    }

    const result = await embed(texts);

    return Response.json({
      embeddings: result.embeddings,
      model: result.model,
      dimensions: DIMENSIONS,
    });
  } catch (e) {
    console.error("embed error:", e);
    return Response.json({ error: (e as Error).message }, { status: 500 });
  }
});
