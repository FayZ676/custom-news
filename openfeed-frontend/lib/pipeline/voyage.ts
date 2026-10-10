import "server-only";

import { EMBEDDING_MODEL } from "@/lib/pipeline/config";

const EMBEDDINGS_URL = "https://api.voyageai.com/v1/embeddings";
const BATCH_SIZE = 128;

// Voyage embeds queries and documents differently so that a short interest
// lands near the full articles it describes.
export type EmbeddingInputType = "query" | "document";

async function embedBatch(
  texts: string[],
  inputType: EmbeddingInputType,
): Promise<number[][]> {
  const response = await fetch(EMBEDDINGS_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.VOYAGE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      input: texts,
      model: EMBEDDING_MODEL,
      input_type: inputType,
    }),
  });
  if (!response.ok) {
    throw new Error(`Voyage ${response.status}: ${await response.text()}`);
  }
  const { data } = (await response.json()) as {
    data: { index: number; embedding: number[] }[];
  };
  return data.sort((a, b) => a.index - b.index).map((d) => d.embedding);
}

export async function embed(
  texts: string[],
  inputType: EmbeddingInputType,
): Promise<number[][]> {
  const embeddings: number[][] = [];
  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    embeddings.push(
      ...(await embedBatch(texts.slice(i, i + BATCH_SIZE), inputType)),
    );
  }
  return embeddings;
}

// pgvector accepts the "[1,2,3]" text form, which is also how PostgREST
// types vector columns.
export function toVector(embedding: number[]): string {
  return JSON.stringify(embedding);
}
