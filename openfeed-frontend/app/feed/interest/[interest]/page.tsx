import { Suspense } from "react";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import {
  readUserArticles,
  getUserInterests,
  getUserArticlesForInterest,
} from "@/lib/backend";

import { ViewInterestFeed } from "@/components/ViewInterestFeed";
import { ViewFeedSkeleton } from "@/components/ViewFeedSkeleton";
import { DrawerMenuInterest } from "@/components/DrawerMenu";

export default async function InterestFeedPage({
  params,
}: {
  params: Promise<{ interest: string }>;
}) {
  const { interest } = await params;
  return (
    <Suspense fallback={<ViewFeedSkeleton />}>
      <FeedContent interestId={interest} />
    </Suspense>
  );
}

async function FeedContent({ interestId }: { interestId: string }) {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  if (!claimsData) throw new Error("Not authenticated");
  const userId = claimsData.claims.sub;

  const interests = await getUserInterests(supabase, userId);

  if (!interests || interests.length === 0) redirect("/feed");

  const activeInterest =
    interests.find((i) => i.id === interestId) ?? interests[0];
  const articles = await getUserArticlesForInterest(
    supabase,
    userId,
    activeInterest.id,
  );

  const initialDrawerInterests: DrawerMenuInterest[] = interests.map((i) => ({
    interest: i,
    hasUnreadArticles: i.has_unread_articles,
  }));

  async function handleReadArticles(articleIds: string[], isRead: boolean) {
    "use server";
    const supabase = await createClient();
    if (!isRead) await readUserArticles(supabase, userId, articleIds);
  }

  return (
    <ViewInterestFeed
      initialDrawerInterests={initialDrawerInterests}
      activeInterest={activeInterest}
      articles={articles}
      handleReadArticles={handleReadArticles}
    />
  );
}
