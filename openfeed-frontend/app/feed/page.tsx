import { Suspense } from "react";
import { redirect } from "next/navigation";

import { getAuthenticatedUser } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";
import { getUserArticles } from "@/lib/supabase/queries/user_articles";
import { getUserInterests } from "@/lib/supabase/queries/user_interests";
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

  const feedArticles = await getUserArticles(supabase, userId);

  return (
    <FeedPageContent
      articles={feedArticles}
      interests={interests}
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
