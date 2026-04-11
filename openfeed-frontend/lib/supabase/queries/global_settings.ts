import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/lib/supabase/supabase.types";

export type GlobalSettings =
  Database["public"]["Tables"]["global_settings"]["Row"];

export async function getGlobalSettings(
  supabase: SupabaseClient<Database>,
): Promise<GlobalSettings> {
  const { data, error } = await supabase
    .from("global_settings")
    .select("*")
    .eq("singleton", true)
    .single();

  if (error) throw new Error(error.message);

  return data;
}
