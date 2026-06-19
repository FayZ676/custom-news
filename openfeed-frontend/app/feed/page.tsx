import { Suspense } from "react";
import { redirect } from "next/navigation";

import { getAuthenticatedUser } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";
import { getUserArticles } from "@/lib/supabase/queries/user_articles";
import { getUserSettings } from "@/lib/supabase/queries/user_settings";
import { getUserInterests } from "@/lib/supabase/queries/user_interests";
import { ingestArticlesForInterests } from "@/lib/articles/ingest";
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

  await ingestArticlesForInterests(userId, interests);

  const feedArticles = await getUserArticles(supabase, userId);
  const { last_visited } = await getUserSettings(supabase, userId);

  const readIds = new Set(
    feedArticles.filter((a) => a.read_at !== null).map((a) => a.id),
  );

  const newIds = new Set(
    feedArticles
      .filter((a) => a.created_at > last_visited && !readIds.has(a.id))
      .map((a) => a.id),
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
