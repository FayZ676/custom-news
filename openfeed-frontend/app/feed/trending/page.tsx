import { Suspense } from "react";
import { cacheLife } from "next/cache";

import { getAuthenticatedUser } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";
import { createAnonClient } from "@/lib/supabase/anon";
import { getStories } from "@/lib/supabase/queries/global_stories";
import { getGlobalSettings } from "@/lib/supabase/queries/global_settings";
import { createShareLink } from "@/lib/supabase/queries/global_share_links";

import {
  ViewTopStories,
  ViewTopStoriesSkeleton,
} from "@/components/ViewTopStories";
import { ShareLinkProvider } from "@/components/ShareLinkContext";

async function fetchCachedStoriesAndSettings() {
  "use cache";
  cacheLife("hours");
  const supabase = createAnonClient();
  const [stories, settings] = await Promise.all([
    getStories(supabase),
    getGlobalSettings(supabase),
  ]);
  return { stories, settings };
}

async function ViewTrendingContent() {
  const [{ userId }, { stories, settings }] = await Promise.all([
    getAuthenticatedUser(),
    fetchCachedStoriesAndSettings(),
  ]);

  const trendingStories = stories.filter(
    (s) => s.score >= settings.cluster_significance_threshold,
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
      <ViewTopStories stories={trendingStories} />
    </ShareLinkProvider>
  );
}

export default function TrendingPage() {
  return (
    <Suspense fallback={<ViewTopStoriesSkeleton />}>
      <ViewTrendingContent />
    </Suspense>
  );
}
