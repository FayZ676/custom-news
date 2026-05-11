import { createClient } from "@supabase/supabase-js";
import { cacheLife, cacheTag } from "next/cache";
import { Database } from "@/lib/supabase/supabase.types";

export async function getGlobalFeeds(): Promise<
  Database["public"]["Tables"]["global_feeds"]["Row"][]
> {
  "use cache";
  cacheLife("days");
  cacheTag("global-feeds");

  const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );

  const { data, error } = await supabase.from("global_feeds").select("*");
  if (error) throw new Error(error.message);
  return data;
}
