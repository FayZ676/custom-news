import { Suspense } from "react";

import { getAuthenticatedUser } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";
import {
  getUserInterestArticles,
  deleteUserInterest,
} from "@/lib/supabase/queries/user_interests";
import { updateUserArticlesRead } from "@/lib/supabase/queries/user_articles";
import { createShareLink } from "@/lib/supabase/queries/global_share_links";

import { ViewFeed, ViewFeedSkeleton } from "@/components/ViewFeed";

async function ViewMyNewsContent() {
  const { userId } = await getAuthenticatedUser();
  const supabase = await createClient();
  const interestArticles = await getUserInterestArticles(supabase, userId);

  async function handleCreateShareLink(
    contentType: "article" | "story",
    contentId: string,
  ): Promise<string> {
    "use server";
    const supabase = await createClient();
    return await createShareLink(supabase, userId, contentType, contentId);
  }

  async function handleReadArticles(articleIds: string[], isRead: boolean) {
    "use server";
    const supabase = await createClient();
    await updateUserArticlesRead(supabase, userId, articleIds, isRead);
  }

  async function handleDeleteInterest(interestId: string) {
    "use server";
    const supabase = await createClient();
    await deleteUserInterest(supabase, userId, interestId);
  }

  return (
    <ViewFeed
      interestArticles={interestArticles}
      handleCreateShareLink={handleCreateShareLink}
      handleDeleteInterest={handleDeleteInterest}
      handleReadUserArticles={handleReadArticles}
    />
  );
}

export default function MyNewsPage() {
  return (
    <Suspense fallback={<ViewFeedSkeleton />}>
      <ViewMyNewsContent />
    </Suspense>
  );
}
