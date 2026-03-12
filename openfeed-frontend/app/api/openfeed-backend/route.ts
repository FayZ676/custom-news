import { FeedArticle, FeedArticleRanked } from "@/db/models";

export async function rankArticles(
  query: string,
  articles: FeedArticle[],
): Promise<FeedArticleRanked[]> {
  const backendUrl =
    process.env.OPENFEED_BACKEND_URL || "http://localhost:8000";

  const response = await fetch(`${backendUrl}/rank`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query,
      articles,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to rank articles: ${response.statusText}`);
  }

  return response.json();
}
