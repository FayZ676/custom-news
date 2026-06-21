export interface FeedArticle {
  id: string;
  title: string;
  summary: string | null;
  url: string;
  source_name: string;
  published_at: string;
  image_url: string | null;
  source_key?: string | null;
}

export const MIN_SEARCH_QUERY_LENGTH = 3;

export async function searchLatestNews(query: string): Promise<FeedArticle[]> {
  const response = await fetch("/api/search/news", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  });
  if (!response.ok) throw new Error("news search failed");
  const { articles } = await response.json();
  return Array.isArray(articles) ? articles : [];
}
