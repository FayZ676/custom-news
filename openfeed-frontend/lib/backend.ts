import { SupabaseClient } from "@supabase/supabase-js";
import { Tables, Database } from "./supabase/supabase.types";

export interface QueryArticle {
  score: number;
  global_article: Tables<"global_articles">;
}

export interface InterestArticle extends QueryArticle {
  is_read: boolean;
}

export interface InterestArticles {
  id: string;
  query: string;
  articles: InterestArticle[];
}

export interface UserArticleScore {
  user_id: string;
  interest_id: string;
  article_id: string;
  score: number;
}

export async function getGlobalFeeds(
  supabase: SupabaseClient<Database>,
): Promise<Database["public"]["Tables"]["global_feeds"]["Row"][]> {
  const { data, error } = await supabase.from("global_feeds").select("*");
  if (error) throw new Error(error.message);
  return data;
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

export async function getGlobalArticlesByPage(
  supabase: SupabaseClient<Database>,
  page: number,
  pageSize: number = 20,
): Promise<InterestArticle[]> {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, error } = await supabase
    .from("global_articles")
    .select("*")
    .order("published_at", { ascending: false })
    .range(from, to);

  if (error) throw new Error(error.message);
  return data.map((a) => ({ is_read: false, score: 0, global_article: a }));
}

export async function matchArticlesByEmbedding(
  supabase: SupabaseClient<Database>,
  embedding: number[],
  matchCount: number,
  minSimilarity: number = 0.0,
): Promise<{ id: string; similarity: number }[]> {
  const { data: matches, error: rpcError } = await supabase.rpc(
    "match_articles",
    {
      query_embedding: JSON.stringify(embedding),
      match_count: matchCount,
      min_similarity: minSimilarity,
    },
  );

  if (rpcError) throw new Error(rpcError.message);
  if (!matches || matches.length === 0) return [];

  return matches.map((m) => ({ id: m.id, similarity: m.similarity }));
}

export async function getGlobalArticlesByIds(
  supabase: SupabaseClient<Database>,
  ids: string[],
): Promise<InterestArticle[]> {
  const { data, error } = await supabase
    .from("global_articles")
    .select("*")
    .in("id", ids);

  if (error) throw new Error(error.message);
  return data.map((a) => ({ is_read: false, score: 0, global_article: a }));
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

export async function getUserSettings(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<Database["public"]["Tables"]["user_settings"]["Row"]> {
  const { data: rows, error } = await supabase
    .from("user_settings")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error) throw new Error(error.message);

  return rows;
}

export async function updateUserNotificationSettings(
  supabase: SupabaseClient<Database>,
  userId: string,
  emailNotifications: boolean,
) {
  const { error } = await supabase
    .from("user_settings")
    .update({ email_notification: emailNotifications })
    .eq("user_id", userId);

  if (error) throw new Error(error.message);
}
