interface OpenAIEmbeddingData {
  object: string;
  index: number;
  embedding: number[];
}

interface OpenAIUsage {
  prompt_tokens: number;
  total_tokens: number;
}

interface OpenAIEmbeddingResponse {
  object: string;
  data: OpenAIEmbeddingData[];
  model: string;
  usage: OpenAIUsage;
}

export interface EmbeddingsResponse {
  embeddings: number[][];
  model: string;
}

export async function embedTexts(texts: string[]): Promise<EmbeddingsResponse> {
  const res = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      input: texts,
      model: "text-embedding-3-small",
      dimensions: 512,
    }),
  });

  if (!res.ok) {
    throw new Error(`OpenAI API error (${res.status}): ${await res.text()}`);
  }

  const data: OpenAIEmbeddingResponse = await res.json();
  const sortedData = [...data.data].sort((a, b) => a.index - b.index);

  return {
    embeddings: sortedData.map((d) => d.embedding),
    model: data.model,
  };
}
