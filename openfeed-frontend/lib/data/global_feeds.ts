import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/lib/supabase/supabase.types";

export async function getGlobalFeeds(
  supabase: SupabaseClient<Database>,
): Promise<Database["public"]["Tables"]["global_feeds"]["Row"][]> {
  const { data, error } = await supabase.from("global_feeds").select("*");
  if (error) throw new Error(error.message);
  return data;
}
