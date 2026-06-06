import { Suspense } from "react";

import { getAuthenticatedUser } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";
import { getSignificantStoriesWithTopicsPage } from "@/lib/supabase/queries/global_stories";
import { getGlobalSettings } from "@/lib/supabase/queries/global_settings";
import { getGlobalTopics } from "@/lib/supabase/queries/global_topics";
import { getUserKeywords } from "@/lib/supabase/queries/user_keywords";
import { getUserTopics } from "@/lib/supabase/queries/user_topics";
import {
  changeKeywordsAction,
  changeTopicsAction,
  createShareLinkAction,
  searchStoriesAction,
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

  const settings = await getGlobalSettings(supabase);
  const topics = await getGlobalTopics(supabase);
  const userTopicRows = await getUserTopics(supabase, userId);
  const userKeywordRows = await getUserKeywords(supabase, userId);
  const { stories: feedStories, hasNextPage } =
    await getSignificantStoriesWithTopicsPage(
      supabase,
      settings.cluster_significance_threshold,
      currentPage,
      PAGE_SIZE,
    );

  const topicIdToName = new Map(topics.map((topic) => [topic.id, topic.name]));
  const initialActiveTopics = userTopicRows
    .map((row) => topicIdToName.get(row.topic_id))
    .filter((topicName): topicName is string => Boolean(topicName));
  const initialKeywords = userKeywordRows.map((row) => row.keywords);

  const handleCreateShareLink = createShareLinkAction.bind(null, userId);
  const handleChangeTopics = changeTopicsAction.bind(null, userId);
  const handleChangeKeywords = changeKeywordsAction.bind(null, userId);

  return (
    <ShareLinkProvider handleCreateShareLink={handleCreateShareLink}>
      <FeedPageContent
        stories={feedStories}
        topics={topics.map((topic) => topic.name)}
        initialActiveTopics={initialActiveTopics}
        initialKeywords={initialKeywords}
        onChangeTopics={handleChangeTopics}
        onChangeKeywords={handleChangeKeywords}
        onSearchStories={searchStoriesAction}
      />
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
