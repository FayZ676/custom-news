import { Suspense } from "react";

import { getAuthenticatedUser } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";
import { getStoriesWithTopics } from "@/lib/supabase/queries/global_stories";
import { getGlobalSettings } from "@/lib/supabase/queries/global_settings";
import { getHiddenStoryIds } from "@/lib/supabase/queries/user_stories_hidden";
import { createShareLink } from "@/lib/supabase/queries/global_share_links";

import { ViewFeed, ViewFeedSkeleton } from "@/components/ViewFeed";
import { ShareLinkProvider } from "@/components/ShareLinkContext";

async function ViewFeedContent() {
  const supabase = await createClient();
  const { userId } = await getAuthenticatedUser();

  const [stories, settings, hiddenStoryIds] = await Promise.all([
    getStoriesWithTopics(supabase),
    getGlobalSettings(supabase),
    userId
      ? getHiddenStoryIds(supabase, userId)
      : Promise.resolve(new Set<string>()),
  ]);

  const feedStories = stories.filter(
    (s) =>
      s.score >= settings.cluster_significance_threshold &&
      !hiddenStoryIds.has(s.id),
  );

  async function handleCreateShareLink(
    contentType: "article" | "story",
    contentId: string,
  ): Promise<string> {
    "use server";
    const supabase = await createClient();
    return await createShareLink(supabase, userId, contentType, contentId);
  }

  return (
    <ShareLinkProvider handleCreateShareLink={handleCreateShareLink}>
      <ViewFeed stories={feedStories} userId={userId} />
    </ShareLinkProvider>
  );
}

export default function FeedPage() {
  return (
    <Suspense fallback={<ViewFeedSkeleton />}>
      <ViewFeedContent />
    </Suspense>
  );
}
