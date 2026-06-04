import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/lib/supabase/supabase.types";

export async function getGlobalTopics(
  supabase: SupabaseClient<Database>,
): Promise<Database["public"]["Tables"]["global_topics"]["Row"][]> {
  const { data, error } = await supabase
    .from("global_topics")
    .select("*")
    .order("id", { ascending: true });

  if (error) throw new Error(error.message);
  return data;
}
