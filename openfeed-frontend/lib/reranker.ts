interface RerankedDocument {
  relevance_score: number;
  index: number;
}

export async function rerankTexts(
  query: string,
  documents: string[],
): Promise<RerankedDocument[]> {
  const response = await fetch("https://api.voyageai.com/v1/rerank", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.VOYAGEAI_API_KEY || ""}`,
    },
    body: JSON.stringify({
      query,
      documents,
      model: "rerank-2.5-lite",
    }),
  });

  const json = await response.json();

  if (!response.ok || !json.data || !Array.isArray(json.data)) {
    console.error("Reranking API error:", json);
    return [];
  }

  return json.data.map(
    (d: any) =>
      ({
        relevance_score: d.relevance_score,
        index: d.index,
      }) as RerankedDocument,
  );
}
