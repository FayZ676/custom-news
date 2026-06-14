import "server-only";

import { FeedArticle } from "@/lib/newsSearch";
import { fetchLatestNewsArticles } from "@/lib/newsSearch.server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import {
  getUserArticles,
  insertUserArticles,
  NewUserArticle,
} from "@/lib/supabase/queries/user_articles";
import { payloadToParams, type NewsQueryPayload } from "@/lib/interests/refine";
import type { UserInterest } from "@/lib/supabase/queries/user_interests";

const API_KEY = process.env.NEWSDATA_API_KEY ?? "";

function interestToParams(interest: UserInterest) {
  const payload: NewsQueryPayload = interest.query_payload ?? {
    q: interest.interest_text,
    qInTitle: null,
    category: null,
    country: null,
    timeframe: null,
  };
  return payloadToParams(payload, API_KEY);
}

async function fetchUniqueArticlesForInterests(
  interests: UserInterest[],
): Promise<FeedArticle[]> {
  const resultsByInterest = await Promise.all(
    interests.map((interest) => fetchLatestNewsArticles(interestToParams(interest))),
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
  interests: UserInterest[],
): Promise<void> {
  const valid = interests.filter(
    (i) => i.interest_text.trim().length > 0 || i.query_payload?.q,
  );
  if (valid.length === 0) return;

  const found = await fetchUniqueArticlesForInterests(valid);
  if (found.length === 0) return;

  const supabase = createServiceRoleClient();
  const storedUrls = new Set(
    (await getUserArticles(supabase, userId)).map((a) => a.url),
  );
  const newArticles = found.filter((a) => !storedUrls.has(a.url));
  if (newArticles.length === 0) return;

  const rows: NewUserArticle[] = newArticles.map((article) => ({
    source_name: article.source_name,
    title: article.title,
    url: article.url,
    summary: article.summary,
    image_url: article.image_url,
    published_at: article.published_at,
  }));

  await insertUserArticles(supabase, userId, rows);
}
