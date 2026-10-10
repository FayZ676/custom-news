import "server-only";

import type { FeedArticle } from "@/lib/newsSearch";
import {
  searchNewsData,
  type NewsQueryPayload,
} from "@/lib/providers/newsdata";

const SUMMARY_MAX_LENGTH = 300;

function normalizeSummary(summary: string | null): string | null {
  if (!summary) return null;
  const trimmed = summary.trimEnd();
  if (trimmed.length <= SUMMARY_MAX_LENGTH) return trimmed;
  return trimmed.slice(0, SUMMARY_MAX_LENGTH).trimEnd() + "…";
}

export async function searchNews(
  payload: NewsQueryPayload,
): Promise<FeedArticle[]> {
  const articles = await searchNewsData(payload);

  const articlesByUrl = new Map<string, FeedArticle>();
  for (const article of articles) {
    if (!articlesByUrl.has(article.url)) {
      articlesByUrl.set(article.url, {
        ...article,
        summary: normalizeSummary(article.summary),
      });
    }
  }
  return [...articlesByUrl.values()];
}
