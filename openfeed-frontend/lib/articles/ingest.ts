import "server-only";

import { FeedArticle } from "@/lib/newsSearch";
import { fetchLatestNewsArticles } from "@/lib/newsSearch.server";
import { embedTexts } from "@/lib/embeddings";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import {
  deleteAllUserArticles,
  getUserArticles,
  insertUserArticles,
  NewUserArticle,
} from "@/lib/supabase/queries/user_articles";

function embeddingText(article: FeedArticle): string {
  return article.summary
    ? `${article.title}\n\n${article.summary}`
    : article.title;
}

async function fetchUniqueArticlesForInterests(
  interests: string[],
): Promise<FeedArticle[]> {
  const resultsByInterest = await Promise.all(
    interests.map((interest) => fetchLatestNewsArticles(interest)),
  );

  const articlesByUrl = new Map<string, FeedArticle>();
  for (const articles of resultsByInterest) {
    for (const article of articles) {
      if (!articlesByUrl.has(article.url)) articlesByUrl.set(article.url, article);
    }
  }
  return [...articlesByUrl.values()];
}

export async function ingestArticlesForInterests(
  userId: string,
  interests: string[],
): Promise<void> {
  const queries = interests.map((t) => t.trim()).filter((t) => t.length > 0);
  if (queries.length === 0) return;

  const found = await fetchUniqueArticlesForInterests(queries);
  if (found.length === 0) return;

  const supabase = createServiceRoleClient();
  const storedUrls = new Set(
    (await getUserArticles(supabase, userId)).map((a) => a.url),
  );
  const newArticles = found.filter((a) => !storedUrls.has(a.url));
  if (newArticles.length === 0) return;

  const embeddings = await embedTexts(newArticles.map(embeddingText));

  const rows: NewUserArticle[] = newArticles.map((article, i) => ({
    source_name: article.source_name,
    title: article.title,
    url: article.url,
    summary: article.summary,
    image_url: article.image_url,
    published_at: article.published_at,
    embedding: embeddings[i] ?? null,
  }));

  await insertUserArticles(supabase, userId, rows);
}

export async function rebuildArticlesForInterests(
  userId: string,
  interests: string[],
): Promise<void> {
  const supabase = createServiceRoleClient();
  await deleteAllUserArticles(supabase, userId);
  await ingestArticlesForInterests(userId, interests);
}
