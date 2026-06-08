import { Suspense } from "react";

import { getAuthenticatedUser } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";
import { getArticlesPage } from "@/lib/supabase/queries/global_articles";
import {
  groupMetadataOptionsByField,
  getGlobalArticleMetadataOptions,
} from "@/lib/supabase/queries/global_article_metadata_options";
import {
  getUserArticleMetadataOptions,
  groupUserMetadataByField,
} from "@/lib/supabase/queries/user_article_metadata_options";
import {
  changeMetadataOptionsAction,
  createShareLinkAction,
} from "@/app/feed/actions";

import { FeedPageContent } from "@/components/FeedPageContent";
import { ViewFeedSkeleton } from "@/components/ViewFeed";
import { ShareLinkProvider } from "@/components/ShareLinkContext";
import {
  FeedPaginationNav,
  FeedPaginationNavSkeleton,
} from "@/components/FeedPaginationNav";

const PAGE_SIZE = 10;

async function ViewFeedContent({ currentPage }: { currentPage: number }) {
  const supabase = await createClient();
  const { userId } = await getAuthenticatedUser();

  const [globalMetadataOptions, userMetadataRows] = await Promise.all([
    getGlobalArticleMetadataOptions(supabase),
    getUserArticleMetadataOptions(supabase, userId),
  ]);
  const metadataOptions = groupMetadataOptionsByField(globalMetadataOptions);
  const initialMetadataFilters = groupUserMetadataByField(userMetadataRows);

  const {
    articles: feedArticles,
    hasNextPage,
    totalPages,
  } = await getArticlesPage(
    supabase,
    currentPage,
    PAGE_SIZE,
    initialMetadataFilters,
  );

  const handleCreateShareLink = createShareLinkAction.bind(null, userId);
  const handleChangeMetadataOptions = changeMetadataOptionsAction.bind(
    null,
    userId,
  );

  return (
    <ShareLinkProvider handleCreateShareLink={handleCreateShareLink}>
      <FeedPageContent
        articles={feedArticles}
        metadataOptions={metadataOptions}
        initialMetadataFilters={initialMetadataFilters}
        onChangeMetadataOptions={handleChangeMetadataOptions}
      />
      <FeedPaginationNav
        currentPage={currentPage}
        hasNextPage={hasNextPage}
        totalPages={totalPages}
      />
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
