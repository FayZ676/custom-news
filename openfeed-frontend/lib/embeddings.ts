import "server-only";

// OpenAI embeddings shared by the query-embedding route
// (app/api/search/embedding) and the feed ingestion path
// (lib/articles/ingest). Model and dimensions must match how articles were
// embedded at ingestion (openfeed-backend OpenAIClient defaults), so semantic
// search compares vectors from the same space.
const EMBEDDING_MODEL = "text-embedding-3-large";
const EMBEDDING_DIMENSIONS = 512;

// Embeds a batch of texts in a single request. Returns one vector per input in
// order, or null for every input if the request fails — embeddings are
// best-effort (the user_articles.embedding column is nullable and the default
// feed orders by published_at, not similarity).
export async function embedTexts(
  texts: string[],
): Promise<(number[] | null)[]> {
  if (texts.length === 0) return [];

  let response: Response;
  try {
    response = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: EMBEDDING_MODEL,
        input: texts,
        dimensions: EMBEDDING_DIMENSIONS,
      }),
    });
  } catch {
    return texts.map(() => null);
  }

  if (!response.ok) return texts.map(() => null);

  const data = await response.json().catch(() => null);
  const items: Array<{ index: number; embedding: number[] }> = Array.isArray(
    data?.data,
  )
    ? data.data
    : [];

  // The API echoes each input's index; map back into request order rather than
  // assuming the response preserves it.
  const byIndex = new Map(items.map((item) => [item.index, item.embedding]));
  return texts.map((_, i) => byIndex.get(i) ?? null);
}

// Convenience for the single-string case used by the query-embedding route.
export async function embedText(text: string): Promise<number[] | null> {
  const [embedding] = await embedTexts([text]);
  return embedding ?? null;
}
