import { SupabaseClient } from "@supabase/supabase-js";

import { Database } from "@/lib/supabase/supabase.types";

export async function getHiddenStoryIds(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<Set<string>> {
  const { data, error } = await (supabase as any)
    .from("user_stories_hidden")
    .select("story_id")
    .eq("user_id", userId);

  if (error) throw new Error(error.message);
  return new Set((data as { story_id: string }[]).map((r) => r.story_id));
}

export async function hideStory(
  supabase: SupabaseClient<Database>,
  userId: string,
  storyId: string,
): Promise<void> {
  const { error } = await supabase
    .from("user_stories_hidden" as any)
    .insert({ user_id: userId, story_id: storyId });

  if (error) throw new Error(error.message);
}
