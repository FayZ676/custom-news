import { SupabaseClient } from "@supabase/supabase-js";
import { Database, Tables } from "@/lib/supabase/supabase.types";

export async function getStories(
  supabase: SupabaseClient<Database>,
): Promise<Tables<"global_stories">[]> {
  const { data, error } = await supabase.from("global_stories").select("*");

  if (error) throw new Error(error.message);
  return data;
}
