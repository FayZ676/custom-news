import "server-only";

const EMBEDDING_MODEL = "text-embedding-3-large";
const EMBEDDING_DIMENSIONS = 512;

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

  const embeddingByIndex = new Map(
    items.map((item) => [item.index, item.embedding]),
  );
  return texts.map((_, i) => embeddingByIndex.get(i) ?? null);
}

export async function embedText(text: string): Promise<number[] | null> {
  const [embedding] = await embedTexts([text]);
  return embedding ?? null;
}
