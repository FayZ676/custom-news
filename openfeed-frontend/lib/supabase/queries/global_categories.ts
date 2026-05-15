import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/lib/supabase/supabase.types";

export async function getGlobalCategories(
  supabase: SupabaseClient<Database>,
): Promise<Database["public"]["Tables"]["global_categories"]["Row"][]> {
  const { data, error } = await supabase
    .from("global_categories")
    .select("*")
    .order("name", { ascending: true });
  if (error) throw new Error(error.message);
  return data;
}
