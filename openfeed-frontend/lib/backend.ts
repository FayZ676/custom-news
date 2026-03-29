import { embedTexts } from "@/actions/embeddings";
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

const MAX_ARTICLES_PER_INTEREST = 20;

export async function updateUserArticleScores(
  supabase: SupabaseClient<Database>,
  userId: string,
  interestId: string,
  interestEmbeddings: number[],
) {
  const { data: matches, error: rpcError } = await supabase.rpc(
    "match_articles",
    {
      query_embedding: JSON.stringify(interestEmbeddings),
      match_count: MAX_ARTICLES_PER_INTEREST,
    },
  );

  if (rpcError) throw new Error(rpcError.message);
  if (!matches || matches.length === 0) return;

  const scores = matches.map((m) => ({
    user_id: userId,
    interest_id: interestId,
    article_id: m.id,
    score: m.similarity,
  }));

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

export async function getGlobalArticlesBySearch(
  supabase: SupabaseClient<Database>,
  query: string,
): Promise<Tables<"global_articles">[]> {
  const { embeddings } = await embedTexts([query]);

  const { data: matches, error: rpcError } = await supabase.rpc(
    "match_articles",
    {
      query_embedding: JSON.stringify(embeddings[0]),
      match_count: MAX_ARTICLES_PER_INTEREST,
    },
  );

  if (rpcError) throw new Error(rpcError.message);
  if (!matches || matches.length === 0) return [];

  const ids = matches.map((m) => m.id);

  const { data: articles, error } = await supabase
    .from("global_articles")
    .select("*")
    .in("id", ids)
    .order("published_at", { ascending: false });

  if (error) throw new Error(error.message);
  return articles;
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

  const { data: articles, error } = await supabase
    .from("global_articles")
    .select("*")
    .in("id", Array.from(isReadMap.keys()))
    .order("published_at", { ascending: false });

  if (error) throw new Error(error.message);

  return articles.map((a) => ({
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
