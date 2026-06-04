import { Suspense } from "react";

import { getAuthenticatedUser } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";
import { getSignificantStoriesWithTopicsPage } from "@/lib/supabase/queries/global_stories";
import { getGlobalSettings } from "@/lib/supabase/queries/global_settings";
import { getGlobalTopics } from "@/lib/supabase/queries/global_topics";
import { createShareLink } from "@/lib/supabase/queries/global_share_links";
import {
  addUserKeyword,
  getUserKeywords,
  removeUserKeyword,
} from "@/lib/supabase/queries/user_keywords";
import {
  addUserTopic,
  getUserTopics,
  removeUserTopic,
} from "@/lib/supabase/queries/user_topics";

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

  async function handleCreateShareLink(
    contentType: "article" | "story",
    contentId: string,
  ): Promise<string> {
    "use server";
    const supabase = await createClient();
    return await createShareLink(supabase, userId, contentType, contentId);
  }

  async function handleChangeTopics(nextTopics: string[]): Promise<void> {
    "use server";
    const supabase = await createClient();
    const [globalTopics, existingRows] = await Promise.all([
      getGlobalTopics(supabase),
      getUserTopics(supabase, userId),
    ]);

    const topicNameToId = new Map(
      globalTopics.map((topic) => [topic.name, topic.id]),
    );
    const desiredTopicIds = new Set(
      nextTopics
        .map((topicName) => topicNameToId.get(topicName))
        .filter((topicId): topicId is string => Boolean(topicId)),
    );
    const existingTopicIds = new Set(existingRows.map((row) => row.topic_id));

    const toAdd = [...desiredTopicIds].filter(
      (topicId) => !existingTopicIds.has(topicId),
    );
    const toRemove = [...existingTopicIds].filter(
      (topicId) => !desiredTopicIds.has(topicId),
    );

    await Promise.all([
      ...toAdd.map((topicId) => addUserTopic(supabase, userId, topicId)),
      ...toRemove.map((topicId) => removeUserTopic(supabase, userId, topicId)),
    ]);
  }

  async function handleChangeKeywords(nextKeywords: string[]): Promise<void> {
    "use server";
    const supabase = await createClient();
    const existingRows = await getUserKeywords(supabase, userId);
    const desiredKeywords = new Set(
      nextKeywords.map((keyword) => keyword.trim()).filter(Boolean),
    );
    const existingKeywords = new Set(existingRows.map((row) => row.keywords));

    const toAdd = [...desiredKeywords].filter(
      (keyword) => !existingKeywords.has(keyword),
    );
    const toRemove = [...existingKeywords].filter(
      (keyword) => !desiredKeywords.has(keyword),
    );

    await Promise.all([
      ...toAdd.map((keyword) => addUserKeyword(supabase, userId, keyword)),
      ...toRemove.map((keyword) =>
        removeUserKeyword(supabase, userId, keyword),
      ),
    ]);
  }

  return (
    <ShareLinkProvider handleCreateShareLink={handleCreateShareLink}>
      <FeedPageContent
        stories={feedStories}
        topics={topics.map((topic) => topic.name)}
        initialActiveTopics={initialActiveTopics}
        initialKeywords={initialKeywords}
        onChangeTopics={handleChangeTopics}
        onChangeKeywords={handleChangeKeywords}
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
