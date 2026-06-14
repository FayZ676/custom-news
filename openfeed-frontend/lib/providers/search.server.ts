import "server-only";

import type { FeedArticle } from "@/lib/newsSearch";
import type { NewsQueryPayload } from "@/lib/interests/refine";
import { newsDataProvider } from "@/lib/providers/newsdata";
import { getProvidersForKeys } from "@/lib/providers/catalog";
import type { FeedCache } from "@/lib/providers/rss";

// The single entry point for "search everything this user gets": the always-on
// NewsData.io base plus any subscribed RSS feeds. Both the daily ingestion path
// and live search call this, so the fan-out + URL de-dup lives in exactly one
// place.
export async function searchProviders(
  payload: NewsQueryPayload,
  subscribedKeys: string[] = [],
  cache: FeedCache = new Map(),
): Promise<FeedArticle[]> {
  const providers = [
    newsDataProvider,
    ...getProvidersForKeys(subscribedKeys, cache),
  ];

  const resultsByProvider = await Promise.all(
    providers.map((provider) => provider.search(payload)),
  );

  const articlesByUrl = new Map<string, FeedArticle>();
  for (const articles of resultsByProvider) {
    for (const article of articles) {
      if (!articlesByUrl.has(article.url)) articlesByUrl.set(article.url, article);
    }
  }
  return [...articlesByUrl.values()];
}
