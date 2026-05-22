import { SupabaseClient } from "@supabase/supabase-js";
import { Database, Tables } from "@/lib/supabase/supabase.types";

export interface StoryWithTopics extends Tables<"global_stories"> {
  medtop_ids: string[];
  medtop_names: string[];
  final_score?: number;
}

export async function getStoriesWithTopics(
  supabase: SupabaseClient<Database>,
): Promise<StoryWithTopics[]> {
  const { data, error } = await (supabase as any)
    .from("global_stories")
    .select("*, global_story_topics(medtop_id, medtop_name)");

  if (error) throw new Error(error.message);

  return (data as any[]).map(({ global_story_topics, ...story }) => ({
    ...story,
    medtop_ids: (
      global_story_topics as { medtop_id: string; medtop_name: string }[]
    ).map((t) => t.medtop_id),
    medtop_names: (
      global_story_topics as { medtop_id: string; medtop_name: string }[]
    ).map((t) => t.medtop_name),
  }));
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
