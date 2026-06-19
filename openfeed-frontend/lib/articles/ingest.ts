import "server-only";

import type { FeedArticle } from "@/lib/newsSearch";
import { searchProviders } from "@/lib/providers/search.server";
import type { FeedCache } from "@/lib/providers/rss";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import {
  getUserArticles,
  insertUserArticles,
  NewUserArticle,
} from "@/lib/supabase/queries/user_articles";
import { getGlobalSourcesByKeys } from "@/lib/supabase/queries/global_sources";
import type { NewsQueryPayload } from "@/lib/interests/refine";
import type { UserInterest } from "@/lib/supabase/queries/user_interests";

function interestToPayload(interest: UserInterest): NewsQueryPayload {
  if (interest.query_payload) return interest.query_payload;
  return {
    q: interest.interest_text,
    qInTitle: null,
    category: null,
    country: null,
    timeframe: null,
    all: [],
    any: [],
    sources: [],
  };
}

type AttributedArticle = FeedArticle & { interest_id: string };

async function fetchUniqueArticlesForInterests(
  interests: UserInterest[],
  cache: FeedCache,
): Promise<AttributedArticle[]> {
  const sourceKeys = new Set<string>();
  for (const interest of interests) {
    for (const key of interest.query_payload?.sources ?? []) {
      if (key !== "newsdata") sourceKeys.add(key);
    }
  }
  const supabaseForSources = createServiceRoleClient();
  const allFeeds = sourceKeys.size > 0
    ? await getGlobalSourcesByKeys(supabaseForSources, [...sourceKeys])
    : [];

  const resultsByInterest = await Promise.all(
    interests.map((interest) =>
      searchProviders(interestToPayload(interest), allFeeds, cache),
    ),
  );

  const articlesByUrl = new Map<string, AttributedArticle>();
  for (let i = 0; i < resultsByInterest.length; i++) {
    for (const article of resultsByInterest[i]) {
      if (!articlesByUrl.has(article.url)) {
        articlesByUrl.set(article.url, { ...article, interest_id: interests[i].id });
      }
    }
  }
  return [...articlesByUrl.values()];
}

export async function ingestArticlesForInterests(
  userId: string,
  interests: UserInterest[],
  cache: FeedCache = new Map(),
): Promise<void> {
  const valid = interests.filter(
    (i) => i.interest_text.trim().length > 0 || i.query_payload?.q,
  );
  if (valid.length === 0) return;

  const found = await fetchUniqueArticlesForInterests(valid, cache);
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
    interest_id: article.interest_id,
    source_key: article.source_key ?? null,
  }));

  await insertUserArticles(supabase, userId, rows);
}
