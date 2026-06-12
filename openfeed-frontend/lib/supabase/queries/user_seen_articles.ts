import { SupabaseClient } from "@supabase/supabase-js";

import { Database } from "@/lib/supabase/supabase.types";

export async function markArticlesAsSeen(
  supabase: SupabaseClient<Database>,
  userId: string,
  articleIds: string[],
): Promise<void> {
  if (articleIds.length === 0) return;

  const rows = articleIds.map((article_id) => ({ user_id: userId, article_id }));

  const { error } = await (supabase as any)
    .from("user_seen_articles")
    .upsert(rows, { onConflict: "user_id,article_id", ignoreDuplicates: true });

  if (error) throw new Error(error.message);
}
