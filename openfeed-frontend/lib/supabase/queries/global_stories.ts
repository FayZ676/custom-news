import { SupabaseClient } from "@supabase/supabase-js";
import { Database, Tables } from "@/lib/supabase/supabase.types";

export async function getStories(
  supabase: SupabaseClient<Database>,
  subscribedCategories: string[],
  subscribedSubCategories: string[],
): Promise<Tables<"global_stories">[]> {
  // No subscribed categories or subcategories → nothing to show.
  if (
    subscribedCategories.length === 0 ||
    subscribedSubCategories.length === 0
  ) {
    return [];
  }

  const { data, error } = await supabase
    .from("global_stories")
    .select("*")
    .in("category_name", subscribedCategories)
    .or(`tags.ov.{${subscribedSubCategories.join(",")}},tags.eq.{}`);

  if (error) throw new Error(error.message);
  return data;
}

export async function getStoriesCount(
  supabase: SupabaseClient<Database>,
): Promise<number> {
  const { count, error } = await supabase
    .from("global_stories")
    .select("*", { count: "exact", head: true });

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
