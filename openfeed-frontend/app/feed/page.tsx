import { Suspense } from "react";
import { redirect } from "next/navigation";

import { getAuthenticatedUser } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";
import { getUserArticles } from "@/lib/supabase/queries/user_articles";
import { getReadArticleIds } from "@/lib/supabase/queries/user_article_interactions";
import { getUserSettings } from "@/lib/supabase/queries/user_settings";
import { getUserInterests } from "@/lib/supabase/queries/user_interests";
import { getSubscribedFeeds, ingestArticlesForInterests } from "@/lib/articles/ingest";
import { FeedPageContent } from "@/components/FeedPageContent";
import { ViewFeedSkeleton } from "@/components/ViewFeed";
import { SearchFilterBarSkeleton } from "@/components/SearchFilterBar/SearchFilterBar";

async function ViewFeedContent() {
  const supabase = await createClient();
  const { userId } = await getAuthenticatedUser();

  const interests = await getUserInterests(supabase, userId);

  if (interests.length === 0) {
    redirect("/onboarding");
  }

  const feeds = await getSubscribedFeeds(supabase, userId);
  await ingestArticlesForInterests(userId, interests, feeds);

  const feedArticles = await getUserArticles(supabase, userId);
  const readIds = await getReadArticleIds(supabase, userId);
  const { feed_last_seen_at } = await getUserSettings(supabase, userId);

  // "New" = arrived since the user's last visit and not yet read. Computed here
  // because FeedArticle (the live-search shape) drops created_at.
  const newIds = new Set(
    feedArticles
      .filter(
        (article) =>
          article.created_at > feed_last_seen_at && !readIds.has(article.id),
      )
      .map((article) => article.id),
  );

  return (
    <FeedPageContent
      articles={feedArticles}
      interests={interests}
      userId={userId}
      readIds={Array.from(readIds)}
      newIds={Array.from(newIds)}
    />
  );
}

export default async function FeedPage() {
  return (
    <Suspense
      fallback={
        <>
          <SearchFilterBarSkeleton />
          <ViewFeedSkeleton />
        </>
      }
    >
      <ViewFeedContent />
    </Suspense>
  );
}
