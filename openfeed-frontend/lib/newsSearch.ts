// Live search results come straight from NewsData.io and are intentionally
// un-enriched: no metadata tags, read-state, or share links. This is the
// subset of fields the feed cards/modal render, and UserArticle structurally
// satisfies it so both flow through the same ViewFeed.
export interface FeedArticle {
  id: string;
  title: string;
  summary: string | null;
  url: string;
  source_name: string;
  published_at: string;
  image_url: string | null;
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
