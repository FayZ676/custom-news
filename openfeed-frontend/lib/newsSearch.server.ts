import "server-only";

import { FeedArticle } from "@/lib/newsSearch";

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

function toIsoUtc(pubDate: string): string {
  return `${pubDate.replace(" ", "T")}Z`;
}

function toFeedArticle(result: NewsDataResult): FeedArticle | null {
  if (!result.title || !result.link || !result.source_name || !result.pubDate) {
    return null;
  }
  return {
    id: result.link,
    title: result.title,
    summary: result.description ?? null,
    url: result.link,
    source_name: result.source_name,
    published_at: toIsoUtc(result.pubDate),
    image_url: result.image_url ?? null,
  };
}

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
