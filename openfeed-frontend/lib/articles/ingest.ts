import "server-only";

import { FeedArticle } from "@/lib/newsSearch";
import { fetchLatestNewsArticles } from "@/lib/newsSearch.server";
import { embedTexts } from "@/lib/embeddings";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import {
  getUserArticles,
  insertUserArticles,
  NewUserArticle,
} from "@/lib/supabase/queries/user_articles";

// The text we embed per article. Mirrors the backend NewsDataArticle.__str__
// (title, then a blank line and the summary) so persisted article vectors live
// in the same space the backend produces.
function embeddingText(article: FeedArticle): string {
  return article.summary
    ? `${article.title}\n\n${article.summary}`
    : article.title;
}

// Queries NewsData.io for each interest, embeds the articles that aren't
// already stored for the user, and inserts them into user_articles. Replaces
// the wait for the hourly backend cron so a feed is populated immediately after
// interests are added (during onboarding or later). Best-effort: NewsData and
// embedding failures degrade to fewer/unembedded articles rather than throwing.
export async function ingestArticlesForInterests(
  userId: string,
  interests: string[],
): Promise<void> {
  const texts = interests.map((t) => t.trim()).filter((t) => t.length > 0);
  if (texts.length === 0) return;

  // Run each interest as its own NewsData query, deduped by URL (one card per
  // article even if several interests surface it), like the backend's
  // _query_articles.
  const resultsByInterest = await Promise.all(
    texts.map((text) => fetchLatestNewsArticles(text)),
  );
  const foundByUrl = new Map<string, FeedArticle>();
  for (const articles of resultsByInterest) {
    for (const article of articles) {
      if (!foundByUrl.has(article.url)) foundByUrl.set(article.url, article);
    }
  }
  if (foundByUrl.size === 0) return;

  const supabase = createServiceRoleClient();

  // Skip URLs already persisted for this user so we don't re-embed them; the DB
  // upsert would ignore the duplicate rows anyway.
  const existingUrls = new Set(
    (await getUserArticles(supabase, userId)).map((a) => a.url),
  );
  const newArticles = [...foundByUrl.values()].filter(
    (a) => !existingUrls.has(a.url),
  );
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
