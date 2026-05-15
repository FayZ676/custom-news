import { Suspense } from "react";

import { getAuthenticatedUser } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";
import { getStories } from "@/lib/supabase/queries/global_stories";
import {
  getUserCategories,
  getUserSubCategoryNames,
} from "@/lib/supabase/queries/user_categories";
import { createShareLink } from "@/lib/supabase/queries/global_share_links";

import {
  ViewTopStories,
  ViewTopStoriesSkeleton,
} from "@/components/ViewTopStories";
import { ShareLinkProvider } from "@/components/ShareLinkContext";

async function ViewTrendingContent() {
  const { userId } = await getAuthenticatedUser();
  const supabase = await createClient();

  const userCategories = await getUserCategories(supabase, userId);
  const subscribedCategoryNames = userCategories
    .sort((a, b) => a.position - b.position)
    .map((c) => c.category_name);

  const subscribedSubCategoryNames = await getUserSubCategoryNames(
    supabase,
    userId,
  );

  const [stories] = await Promise.all([
    getStories(supabase, subscribedCategoryNames, subscribedSubCategoryNames),
  ]);

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
      <ViewTopStories
        stories={stories}
        categoryOrder={subscribedCategoryNames}
      />
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
