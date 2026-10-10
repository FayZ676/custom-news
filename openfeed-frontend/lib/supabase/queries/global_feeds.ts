import { SupabaseClient } from "@supabase/supabase-js";

import { Database, Tables } from "@/lib/supabase/supabase.types";

export type GlobalFeed = Tables<"global_feeds">;

export async function getGlobalFeeds(
  supabase: SupabaseClient<Database>,
): Promise<GlobalFeed[]> {
  const { data, error } = await supabase.from("global_feeds").select("*");

  if (error) throw new Error(error.message);
  return data;
}
