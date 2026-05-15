import { Suspense } from "react";

import { getAuthenticatedUser } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";
import {
  getUserInterestStories,
  deleteUserInterest,
} from "@/lib/supabase/queries/user_interests";
import { updateUserStoriesRead } from "@/lib/supabase/queries/user_stories";
import { createShareLink } from "@/lib/supabase/queries/global_share_links";

import { ViewFeed, ViewFeedSkeleton } from "@/components/ViewFeed";
import { ShareLinkProvider } from "@/components/ShareLinkContext";

async function ViewMyNewsContent() {
  const { userId } = await getAuthenticatedUser();
  const supabase = await createClient();
  const interestStories = await getUserInterestStories(supabase, userId);

  async function handleCreateShareLink(
    contentType: "article" | "story",
    contentId: string,
  ): Promise<string> {
    "use server";
    const supabase = await createClient();
    return await createShareLink(supabase, userId, contentType, contentId);
  }

  async function handleReadStories(storyIds: string[], isRead: boolean) {
    "use server";
    const supabase = await createClient();
    await updateUserStoriesRead(supabase, userId, storyIds, isRead);
  }

  async function handleDeleteInterest(interestId: string) {
    "use server";
    const supabase = await createClient();
    await deleteUserInterest(supabase, userId, interestId);
  }

  return (
    <ShareLinkProvider handleCreateShareLink={handleCreateShareLink}>
      <ViewFeed
        interestStories={interestStories}
        handleDeleteInterest={handleDeleteInterest}
        handleReadUserStories={handleReadStories}
      />
    </ShareLinkProvider>
  );
}

export default function MyNewsPage() {
  return (
    <Suspense fallback={<ViewFeedSkeleton />}>
      <ViewMyNewsContent />
    </Suspense>
  );
}
