import "server-only";

import type { FeedArticle } from "@/lib/newsSearch";
import type { NewsQueryPayload } from "@/lib/interests/refine";
import { newsDataProvider } from "@/lib/providers/newsdata";
import { createRssProvider, type FeedCache } from "@/lib/providers/rss";
import type { FeedDefinition } from "@/lib/providers/types";

export async function searchProviders(
  payload: NewsQueryPayload,
  subscribedFeeds: FeedDefinition[] = [],
  cache: FeedCache = new Map(),
): Promise<FeedArticle[]> {
  const providers = [
    newsDataProvider,
    ...subscribedFeeds.map((feed) => createRssProvider(feed, cache)),
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
