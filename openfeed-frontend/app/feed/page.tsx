import { Suspense } from "react";

import { getAuthenticatedUser } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";
import { getSignificantStoriesWithTopicsPage } from "@/lib/supabase/queries/global_stories";
import { getGlobalSettings } from "@/lib/supabase/queries/global_settings";
import { createShareLink } from "@/lib/supabase/queries/global_share_links";

import { ViewFeed, ViewFeedSkeleton } from "@/components/ViewFeed";
import { ShareLinkProvider } from "@/components/ShareLinkContext";
import {
  FeedPaginationNav,
  FeedPaginationNavSkeleton,
} from "@/components/FeedPaginationNav";

const PAGE_SIZE = 10;

async function ViewFeedContent({ currentPage }: { currentPage: number }) {
  const supabase = await createClient();
  const { userId } = await getAuthenticatedUser();

  const settings = await getGlobalSettings(supabase);
  const { stories: feedStories, hasNextPage } =
    await getSignificantStoriesWithTopicsPage(
      supabase,
      settings.cluster_significance_threshold,
      currentPage,
      PAGE_SIZE,
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
      <ViewFeed stories={feedStories} />
      <FeedPaginationNav currentPage={currentPage} hasNextPage={hasNextPage} />
    </ShareLinkProvider>
  );
}

export default async function FeedPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page } = await searchParams;
  const parsedPage = Number.parseInt(page ?? "1", 10);
  const currentPage =
    Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;

  return (
    <Suspense
      fallback={
        <>
          <ViewFeedSkeleton />
          <FeedPaginationNavSkeleton />
        </>
      }
    >
      <ViewFeedContent currentPage={currentPage} />
    </Suspense>
  );
}
