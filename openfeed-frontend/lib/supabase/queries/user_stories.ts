import { SupabaseClient } from "@supabase/supabase-js";
import { Database, Tables } from "@/lib/supabase/supabase.types";

export interface InterestStory {
  is_read: boolean;
  score: number;
  global_story: Tables<"global_stories">;
}

export interface UserStoryScore {
  user_id: string;
  interest_id: string;
  story_id: string;
  score: number;
}

export async function getUserStoriesForInterest(
  supabase: SupabaseClient<Database>,
  userId: string,
  interestId: string,
): Promise<InterestStory[]> {
  const { data: rows, error } = await supabase
    .from("user_stories")
    .select("is_read, score, global_stories(*)")
    .eq("user_id", userId)
    .eq("interest_id", interestId);

  if (error) throw new Error(error.message);
  if (!rows || rows.length === 0) return [];

  return rows
    .map((r) => ({
      is_read: r.is_read,
      score: r.score,
      global_story: r.global_stories as Tables<"global_stories">,
    }))
    .sort((a, b) => b.score - a.score);
}

export async function updateUserStoriesRead(
  supabase: SupabaseClient<Database>,
  userId: string,
  storyIds: string[],
  isRead: boolean,
) {
  const { error } = await supabase
    .from("user_stories")
    .update({ is_read: isRead })
    .eq("user_id", userId)
    .in("story_id", storyIds);

  if (error) throw new Error(error.message);
}

export async function getUnreadStoryCount(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<number> {
  const { count, error } = await supabase
    .from("user_stories")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("is_read", false);

  if (error) throw new Error(error.message);
  return count ?? 0;
}

export async function updateUserStories(
  supabase: SupabaseClient<Database>,
  scores: UserStoryScore[],
) {
  const { error } = await supabase.from("user_stories").upsert(scores, {
    onConflict: "user_id,interest_id,story_id",
  });

  if (error) throw new Error(error.message);
}
