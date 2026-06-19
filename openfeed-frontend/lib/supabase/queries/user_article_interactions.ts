import { SupabaseClient } from "@supabase/supabase-js";

import { Database } from "@/lib/supabase/supabase.types";

export async function getReadArticleIds(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<Set<string>> {
  const { data, error } = await supabase
    .from("user_article_interactions")
    .select("article_id")
    .eq("user_id", userId)
    .not("read_at", "is", null);

  if (error) throw new Error(error.message);
  return new Set(data.map((row) => row.article_id));
}

export async function markArticleRead(
  supabase: SupabaseClient<Database>,
  userId: string,
  articleId: string,
): Promise<void> {
  const now = new Date().toISOString();
  const { error } = await supabase
    .from("user_article_interactions")
    .upsert(
      { user_id: userId, article_id: articleId, read_at: now, updated_at: now },
      { onConflict: "user_id,article_id" },
    );

  if (error) throw new Error(error.message);
}
