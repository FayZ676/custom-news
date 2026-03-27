import { Suspense } from "react";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import {
  readUserArticle,
  getUserInterests,
  getUserArticlesForInterest,
} from "@/lib/backend";

import { InterestFeedView } from "@/components/ViewInterestFeed";

async function FeedContent({ interestId }: { interestId: string }) {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  if (!claimsData) throw new Error("Not authenticated");

  const userId = claimsData.claims.sub;
  const interests = await getUserInterests(userId);

  if (!interests || interests.length === 0) redirect("/feed");

  const activeInterest =
    interests.find((i) => i.id === interestId) ?? interests[0];
  const articles = await getUserArticlesForInterest(userId, activeInterest.id);

  async function handleOpenArticle(articleId: string, isRead: boolean) {
    "use server";
    if (!isRead) await readUserArticle(userId, articleId);
  }

  return (
    <InterestFeedView
      initialInterests={interests}
      activeInterest={activeInterest}
      articles={articles}
      handleOpenArticle={handleOpenArticle}
    />
  );
}

export default async function InterestFeedPage({
  params,
}: {
  params: Promise<{ interest: string }>;
}) {
  const { interest } = await params;
  return (
    <Suspense fallback={<div>Loading feed...</div>}>
      <FeedContent interestId={interest} />
    </Suspense>
  );
}
