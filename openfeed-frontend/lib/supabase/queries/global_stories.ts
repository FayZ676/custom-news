import { SupabaseClient } from "@supabase/supabase-js";
import { Database, Tables } from "@/lib/supabase/supabase.types";

export interface StoryWithTopics extends Tables<"global_stories"> {
  topic_ids: string[];
  topic_names: string[];
  final_score?: number;
}

export interface PaginatedStories {
  stories: StoryWithTopics[];
  hasNextPage: boolean;
}

export async function getStoriesWithTopics(
  supabase: SupabaseClient<Database>,
): Promise<StoryWithTopics[]> {
  const { data, error } = await (supabase as any)
    .from("global_stories")
    .select("*, global_story_topics(topic_id, topic_name)");

  if (error) throw new Error(error.message);

  return (data as any[]).map(({ global_story_topics, ...story }) => ({
    ...story,
    topic_ids: (
      global_story_topics as { topic_id: string; topic_name: string }[]
    ).map((t) => t.topic_id),
    topic_names: (
      global_story_topics as { topic_id: string; topic_name: string }[]
    ).map((t) => t.topic_name),
  }));
}

export async function getSignificantStoriesWithTopicsPage(
  supabase: SupabaseClient<Database>,
  threshold: number,
  page: number,
  pageSize: number,
): Promise<PaginatedStories> {
  const start = (page - 1) * pageSize;
  const end = start + pageSize;

  const { data, error } = await (supabase as any)
    .from("global_stories")
    .select("*, global_story_topics(topic_id, topic_name)")
    .gte("score", threshold)
    .order("score", { ascending: false })
    .range(start, end);

  if (error) throw new Error(error.message);

  const allRows = (data as any[]) ?? [];
  const hasNextPage = allRows.length > pageSize;
  const pageRows = allRows.slice(0, pageSize);

  return {
    stories: pageRows.map(({ global_story_topics, ...story }) => ({
      ...story,
      topic_ids: (
        global_story_topics as { topic_id: string; topic_name: string }[]
      ).map((t) => t.topic_id),
      topic_names: (
        global_story_topics as { topic_id: string; topic_name: string }[]
      ).map((t) => t.topic_name),
    })),
    hasNextPage,
  };
}

export interface InterestArticle {
  is_read: boolean;
  global_article: Tables<"global_articles">;
}

export interface QueryArticle {
  global_article: Tables<"global_articles">;
}

export async function getStories(
  supabase: SupabaseClient<Database>,
): Promise<Tables<"global_stories">[]> {
  const { data, error } = await supabase.from("global_stories").select("*");

  if (error) throw new Error(error.message);
  return data;
}

export async function getSignificantStoriesCount(
  supabase: SupabaseClient<Database>,
  threshold: number,
): Promise<number> {
  const { count, error } = await supabase
    .from("global_stories")
    .select("*", { count: "exact", head: true })
    .gte("score", threshold);

  if (error) throw new Error(error.message);
  return count ?? 0;
}

export async function getStoryById(
  supabase: SupabaseClient<Database>,
  id: string,
): Promise<Tables<"global_stories"> | null> {
  const { data, error } = await supabase
    .from("global_stories")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
}

export async function getStoriesByIds(
  supabase: SupabaseClient<Database>,
  ids: string[],
): Promise<Tables<"global_stories">[]> {
  const { data, error } = await supabase
    .from("global_stories")
    .select("*")
    .in("id", ids);

  if (error) throw new Error(error.message);
  return data;
}

export async function getStoriesWithTopicsByIds(
  supabase: SupabaseClient<Database>,
  ids: string[],
): Promise<StoryWithTopics[]> {
  if (ids.length === 0) return [];

  const { data, error } = await (supabase as any)
    .from("global_stories")
    .select("*, global_story_topics(topic_id, topic_name)")
    .in("id", ids);

  if (error) throw new Error(error.message);

  const stories = ((data as any[]) ?? []).map(
    ({ global_story_topics, ...story }) => ({
      ...story,
      topic_ids: (
        global_story_topics as { topic_id: string; topic_name: string }[]
      ).map((t) => t.topic_id),
      topic_names: (
        global_story_topics as { topic_id: string; topic_name: string }[]
      ).map((t) => t.topic_name),
    }),
  );

  const byId = new Map(stories.map((story) => [story.id, story]));
  return ids
    .map((id) => byId.get(id))
    .filter((story): story is StoryWithTopics => Boolean(story));
}
