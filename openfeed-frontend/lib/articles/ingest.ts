import "server-only";

import type { FeedArticle } from "@/lib/newsSearch";
import { searchNews } from "@/lib/providers/search.server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import {
  getUserArticles,
  insertUserArticles,
  NewUserArticle,
} from "@/lib/supabase/queries/user_articles";
import {
  createNewsQueryPayload,
  type NewsQueryPayload,
} from "@/lib/providers/newsdata";
import type { UserInterest } from "@/lib/supabase/queries/user_interests";

function interestToPayload(interest: UserInterest): NewsQueryPayload {
  if (interest.query_payload) return interest.query_payload;
  return createNewsQueryPayload({ q: interest.interest_text });
}

type AttributedArticle = FeedArticle & { interest_id: string };

async function fetchUniqueArticlesForInterests(
  interests: UserInterest[],
): Promise<AttributedArticle[]> {
  const resultsByInterest = await Promise.all(
    interests.map((interest) => searchNews(interestToPayload(interest))),
  );

  const articlesByUrl = new Map<string, AttributedArticle>();
  for (let i = 0; i < resultsByInterest.length; i++) {
    for (const article of resultsByInterest[i]) {
      if (!articlesByUrl.has(article.url)) {
        articlesByUrl.set(article.url, {
          ...article,
          interest_id: interests[i].id,
        });
      }
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
    interest_id: article.interest_id,
  }));

  await insertUserArticles(supabase, userId, rows);
}
