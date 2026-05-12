import { SupabaseClient, createClient } from "@supabase/supabase-js";
import { unstable_cacheLife as cacheLife } from "next/cache";
import { Database } from "@/lib/supabase/supabase.types";

export async function getGlobalFeeds(
  supabase: SupabaseClient<Database>,
): Promise<Database["public"]["Tables"]["global_feeds"]["Row"][]> {
  const { data, error } = await supabase.from("global_feeds").select("*");
  if (error) throw new Error(error.message);
  return data;
}

// Cached version — global_feeds is publicly readable (anon RLS policy),
// so no cookies or service role needed. Safe to cache across all users.
export async function getCachedGlobalFeeds(): Promise<
  Database["public"]["Tables"]["global_feeds"]["Row"][]
> {
  "use cache";
  cacheLife("days");
  const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
  return getGlobalFeeds(supabase);
}
