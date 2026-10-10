import { SupabaseClient } from "@supabase/supabase-js";

import {
  Database,
  Tables,
  TablesInsert,
} from "@/lib/supabase/supabase.types";

export type UserArticleMatch = Tables<"user_article_matches">;

export async function insertMatches(
  supabase: SupabaseClient<Database>,
  matches: TablesInsert<"user_article_matches">[],
): Promise<void> {
  if (matches.length === 0) return;

  const { error } = await supabase
    .from("user_article_matches")
    .upsert(matches, {
      onConflict: "interest_id,article_id",
      ignoreDuplicates: true,
    });

  if (error) throw new Error(error.message);
}

export async function deleteMatchesForInterest(
  supabase: SupabaseClient<Database>,
  interestId: string,
): Promise<void> {
  const { error } = await supabase
    .from("user_article_matches")
    .delete()
    .eq("interest_id", interestId);

  if (error) throw new Error(error.message);
}

export async function getMatch(
  supabase: SupabaseClient<Database>,
  interestId: string,
  articleId: string,
): Promise<UserArticleMatch | null> {
  const { data, error } = await supabase
    .from("user_article_matches")
    .select("*")
    .eq("interest_id", interestId)
    .eq("article_id", articleId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
}
