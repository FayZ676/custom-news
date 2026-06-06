"use server";

import { searchStories } from "@/lib/story-search";
import { createClient } from "@/lib/supabase/server";
import { createShareLink } from "@/lib/supabase/queries/global_share_links";
import { getGlobalTopics } from "@/lib/supabase/queries/global_topics";
import {
  StoryWithTopics,
  getStoriesWithTopicsByIds,
} from "@/lib/supabase/queries/global_stories";
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

export async function createShareLinkAction(
  userId: string,
  contentType: "article" | "story",
  contentId: string,
): Promise<string> {
  const supabase = await createClient();
  return createShareLink(supabase, userId, contentType, contentId);
}

export async function changeTopicsAction(
  userId: string,
  nextTopics: string[],
): Promise<void> {
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

export async function changeKeywordsAction(
  userId: string,
  nextKeywords: string[],
): Promise<void> {
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
    ...toRemove.map((keyword) => removeUserKeyword(supabase, userId, keyword)),
  ]);
}

export async function searchStoriesAction(
  query: string,
): Promise<StoryWithTopics[]> {
  const trimmedQuery = query.trim();
  if (!trimmedQuery) return [];

  const supabase = await createClient();
  const { stories } = await searchStories<StoryWithTopics>({
    supabase,
    query: trimmedQuery,
    loadStoriesByIds: (ids) => getStoriesWithTopicsByIds(supabase, ids),
  });

  return stories;
}
