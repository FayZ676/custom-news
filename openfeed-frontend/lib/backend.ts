import { SupabaseClient } from "@supabase/supabase-js";
import { Tables, Database } from "./supabase/supabase.types";

export interface Article extends Tables<"global_articles"> {
  is_read?: boolean;
}

export interface Interest {
  id: string;
  query: string;
  unread_articles_count: number;
}

export interface UserArticleScore {
  user_id: string;
  interest_id: string;
  article_id: string;
  score: number;
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

export async function readUserArticles(
  supabase: SupabaseClient<Database>,
  userId: string,
  articleIds: string[],
) {
  const { error } = await supabase
    .from("user_articles")
    .update({ is_read: true })
    .eq("user_id", userId)
    .in("article_id", articleIds);

  if (error) throw new Error(error.message);
}

export async function getGlobalArticlesByPage(
  supabase: SupabaseClient<Database>,
  page: number,
  pageSize: number = 20,
): Promise<Tables<"global_articles">[]> {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, error } = await supabase
    .from("global_articles")
    .select("*")
    .order("published_at", { ascending: false })
    .range(from, to);

  if (error) throw new Error(error.message);
  return data;
}

export async function matchArticlesByEmbedding(
  supabase: SupabaseClient<Database>,
  embedding: number[],
  matchCount: number,
): Promise<{ id: string; similarity: number }[]> {
  const { data: matches, error: rpcError } = await supabase.rpc(
    "match_articles",
    {
      query_embedding: JSON.stringify(embedding),
      match_count: matchCount,
    },
  );

  if (rpcError) throw new Error(rpcError.message);
  if (!matches || matches.length === 0) return [];

  return matches.map((m) => ({ id: m.id, similarity: m.similarity }));
}

export async function getGlobalArticlesByIds(
  supabase: SupabaseClient<Database>,
  ids: string[],
): Promise<Tables<"global_articles">[]> {
  const { data, error } = await supabase
    .from("global_articles")
    .select("*")
    .in("id", ids);

  if (error) throw new Error(error.message);
  return data;
}

export async function getUserArticlesForInterest(
  supabase: SupabaseClient<Database>,
  userId: string,
  interestId: string,
): Promise<Article[]> {
  const { data: rows, error: uaError } = await supabase
    .from("user_articles")
    .select("article_id, is_read")
    .eq("user_id", userId)
    .eq("interest_id", interestId);

  if (uaError) throw new Error(uaError.message);
  if (!rows || rows.length === 0) return [];

  const isReadMap = new Map(rows.map((r) => [r.article_id, r.is_read]));
  const articles = await getGlobalArticlesByIds(
    supabase,
    Array.from(isReadMap.keys()),
  );

  return articles
    .sort(
      (a, b) =>
        new Date(b.published_at!).getTime() -
        new Date(a.published_at!).getTime(),
    )
    .map((a) => ({
      ...a,
      is_read: isReadMap.get(a.id) ?? false,
    }));
}

export async function getUserInterests(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<Interest[]> {
  const { data: rows, error } = await supabase
    .from("user_interests")
    .select("id, query, user_articles(is_read)")
    .eq("user_id", userId);

  if (error) throw new Error(error.message);

  return (rows ?? []).map((r) => {
    const userArticles = (r.user_articles ?? []) as { is_read: boolean }[];
    return {
      id: r.id,
      query: r.query,
      unread_articles_count: userArticles.filter((a) => !a.is_read).length,
    };
  });
}
