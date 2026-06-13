import "server-only";

import { FeedArticle } from "@/lib/newsSearch";

// Server-only NewsData.io fetch shared by the live-search route
// (app/api/search/news) and the feed ingestion path (lib/articles/ingest).
// Mirrors the backend's openfeed.clients.newsdata.get_latest_articles: query
// NewsData.io's /latest endpoint for fresh articles matching the search term.
// The API key stays server-side; the browser never calls NewsData directly.
// First page of results only.
const LATEST_URL = "https://newsdata.io/api/1/latest";
const REQUEST_TIMEOUT_MS = 30_000;

interface NewsDataResult {
  title?: string;
  link?: string;
  description?: string | null;
  image_url?: string | null;
  source_name?: string;
  pubDate?: string;
}

// NewsData returns pubDate as a naive "YYYY-MM-DD HH:MM:SS" in UTC.
function toIsoUtc(pubDate: string): string {
  return `${pubDate.replace(" ", "T")}Z`;
}

function toFeedArticle(result: NewsDataResult): FeedArticle | null {
  if (!result.title || !result.link || !result.source_name || !result.pubDate) {
    return null;
  }
  return {
    // No DB id exists for live results; the URL keys the card and is never
    // shareable (ViewFeed disables sharing while searching).
    id: result.link,
    title: result.title,
    summary: result.description ?? null,
    url: result.link,
    source_name: result.source_name,
    published_at: toIsoUtc(result.pubDate),
    image_url: result.image_url ?? null,
  };
}

// Returns the latest articles matching a query, or [] on any failure (network,
// non-2xx, malformed payload). Callers decide how to surface an empty result.
export async function fetchLatestNewsArticles(
  query: string,
): Promise<FeedArticle[]> {
  const params = new URLSearchParams({
    apikey: process.env.NEWSDATA_API_KEY ?? "",
    q: query.trim(),
    language: "en",
    removeduplicate: "1",
  });

  let response: Response;
  try {
    response = await fetch(`${LATEST_URL}?${params}`, {
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch {
    return [];
  }

  if (!response.ok) return [];

  const data = await response.json().catch(() => null);
  const results: NewsDataResult[] = Array.isArray(data?.results)
    ? data.results
    : [];
  return results
    .map(toFeedArticle)
    .filter((article): article is FeedArticle => article !== null);
}
