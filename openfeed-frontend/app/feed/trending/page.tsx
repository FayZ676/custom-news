import { Suspense } from "react";
import { cacheLife } from "next/cache";

import { getAuthenticatedUser } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";
import { createAnonClient } from "@/lib/supabase/anon";
import { getStories } from "@/lib/supabase/queries/global_stories";
import { createShareLink } from "@/lib/supabase/queries/global_share_links";

import {
  ViewTopStories,
  ViewTopStoriesSkeleton,
} from "@/components/ViewTopStories";

async function getCachedStories() {
  "use cache";
  cacheLife("hours");
  const supabase = createAnonClient();
  return await getStories(supabase);
}

async function ViewTrendingContent() {
  const { userId } = await getAuthenticatedUser();
  const stories = await getCachedStories();

  async function handleCreateShareLink(
    contentType: "article" | "story",
    contentId: string,
  ): Promise<string> {
    "use server";
    const supabase = await createClient();
    return await createShareLink(supabase, userId, contentType, contentId);
  }

  return (
    <ViewTopStories
      stories={stories}
      handleCreateShareLink={handleCreateShareLink}
    />
  );
}

export default function TrendingPage() {
  return (
    <Suspense fallback={<ViewTopStoriesSkeleton />}>
      <ViewTrendingContent />
    </Suspense>
  );
}
