import { SupabaseClient } from "@supabase/supabase-js";
import { Tables, Database } from "@/lib/supabase/supabase.types";

import { InterestArticle } from "@/lib/data/global_articles";

export interface UserArticleScore {
  user_id: string;
  interest_id: string;
  article_id: string;
  score: number;
}

export async function getUserArticlesForInterest(
  supabase: SupabaseClient<Database>,
  userId: string,
  interestId: string,
): Promise<InterestArticle[]> {
  const { data: rows, error: uaError } = await supabase
    .from("user_articles")
    .select("is_read, score, global_articles(*)")
    .eq("user_id", userId)
    .eq("interest_id", interestId);

  if (uaError) throw new Error(uaError.message);
  if (!rows || rows.length === 0) return [];

  return rows
    .map((r) => ({
      is_read: r.is_read,
      score: r.score,
      global_article: r.global_articles as Tables<"global_articles">,
    }))
    .sort((a, b) => b.score - a.score);
}

export async function updateUserArticlesRead(
  supabase: SupabaseClient<Database>,
  userId: string,
  articleIds: string[],
  isRead: boolean,
) {
  const { error } = await supabase
    .from("user_articles")
    .update({ is_read: isRead })
    .eq("user_id", userId)
    .in("article_id", articleIds);

  if (error) throw new Error(error.message);
}

export async function updateUserArticles(
  supabase: SupabaseClient<Database>,
  scores: UserArticleScore[],
) {
  const { error } = await supabase.from("user_articles").upsert(scores, {
    onConflict: "user_id,interest_id,article_id",
  });

  if (error) throw new Error(error.message);
}
