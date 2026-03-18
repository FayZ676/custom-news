// @ts-nocheck

import type { ParsedArticle } from "./parse_feed.ts";

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY")!;
const MODEL = "text-embedding-3-small";
export const DIMENSIONS = 512;

const BATCH_SIZE = 100;

/** Max chars for embedding input (~1 000 tokens). */
const MAX_CONTENT_CHARS = 3_000;

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

// ─── Text preparation ───────────────────────────────────────

/** Build embedding input from an article, truncating content to fit model limits. */
function articleToEmbedText(a: ParsedArticle): string {
  const parts: string[] = [a.title];

  if (a.summary) parts.push(a.summary);

  if (a.content) {
    for (const c of a.content) {
      if (c.value && c.value !== a.summary) {
        parts.push(
          c.value.length <= MAX_CONTENT_CHARS
            ? c.value
            : c.value.slice(0, MAX_CONTENT_CHARS),
        );
        break;
      }
    }
  }

  return parts.join("\n\n");
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
  const sorted = json.data.sort((a, b) => a.index - b.index);

  return {
    embeddings: sorted.map((d) => d.embedding),
    model: json.model,
  };
}

// ─── Public API ─────────────────────────────────────────────

/** Embed an array of articles, handling batching and text preparation. */
export async function embedArticles(
  articles: ParsedArticle[],
): Promise<{ embeddings: number[][]; model: string }> {
  const texts = articles.map(articleToEmbedText);
  const allEmbeddings: number[][] = [];
  let model = "";

  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts.slice(i, i + BATCH_SIZE);
    const result = await embed(batch);
    allEmbeddings.push(...result.embeddings);
    model = result.model;
  }

  return { embeddings: allEmbeddings, model };
}
