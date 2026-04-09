import { embedTexts } from "@/lib/embeddings";
import { SupabaseClient } from "@supabase/supabase-js";
import { Database, Tables } from "@/lib/supabase/supabase.types";

import { InterestArticle, InterestArticles } from "./global_articles";

export async function insertUserInterest(
  supabase: SupabaseClient,
  userId: string,
  query: string,
) {
  const embedData = await embedTexts([query]);
  const embeddings: number[] = embedData.embeddings[0];

  const { data: interest, error } = await supabase
    .from("user_interests")
    .insert({
      user_id: userId,
      query,
      embeddings: JSON.stringify(embeddings),
      embedding_model: "",
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);
  return { interestId: interest.id, interestEmbeddings: embeddings };
}

export async function deleteUserInterest(
  supabase: SupabaseClient,
  userId: string,
  interestId: string,
) {
  const { error } = await supabase
    .from("user_interests")
    .delete()
    .eq("id", interestId)
    .eq("user_id", userId);

  if (error) throw new Error(error.message);
}

export async function getUserInterestArticles(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<InterestArticles[]> {
  const { data: rows, error } = await supabase
    .from("user_interests")
    .select("id, query, user_articles(is_read, score, global_articles(*))")
    .eq("user_id", userId);

  if (error) throw new Error(error.message);

  return (rows ?? []).map((r) => ({
    id: r.id,
    query: r.query,
    articles: (r.user_articles as any[])
      .map((ua) => ({
        is_read: ua.is_read,
        score: ua.score,
        global_article: ua.global_articles as Tables<"global_articles">,
      }))
      .sort((a: InterestArticle, b: InterestArticle) => b.score - a.score),
  }));
}
