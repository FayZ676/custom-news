import { SupabaseClient } from "@supabase/supabase-js";

import { Database, Tables } from "@/lib/supabase/supabase.types";

export type UserArticle = Tables<"user_articles">;

export interface NewUserArticle {
  source_name: string;
  title: string;
  url: string;
  summary: string | null;
  image_url: string | null;
  published_at: string;
  interest_id: string | null;
  source_key: string | null;
}

// The get_shared_article RPC returns only the display columns.
export type SharedArticle = Omit<UserArticle, "user_id" | "search_vector">;

export async function getUserArticles(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<UserArticle[]> {
  const { data, error } = await supabase
    .from("user_articles")
    .select("*")
    .eq("user_id", userId)
    .order("published_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data;
}

export async function insertUserArticles(
  supabase: SupabaseClient<Database>,
  userId: string,
  articles: NewUserArticle[],
): Promise<void> {
  if (articles.length === 0) return;

  const rows = articles.map((article) => ({
    user_id: userId,
    source_name: article.source_name,
    title: article.title,
    url: article.url,
    summary: article.summary,
    image_url: article.image_url,
    published_at: article.published_at,
    interest_id: article.interest_id,
    source_key: article.source_key,
  }));

  const { error } = await (supabase as any)
    .from("user_articles")
    .upsert(rows, { onConflict: "user_id,url", ignoreDuplicates: true });

  if (error) throw new Error(error.message);
}

export async function deleteUserArticlesBySourceKey(
  supabase: SupabaseClient<Database>,
  userId: string,
  sourceKey: string,
): Promise<void> {
  const { error } = await (supabase as any)
    .from("user_articles")
    .delete()
    .eq("user_id", userId)
    .eq("source_key", sourceKey)
    .is("interest_id", null);

  if (error) throw new Error(error.message);
}

export async function deleteAllUserArticles(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<void> {
  const { error } = await (supabase as any)
    .from("user_articles")
    .delete()
    .eq("user_id", userId);

  if (error) throw new Error(error.message);
}

export async function getUserArticleById(
  supabase: SupabaseClient<Database>,
  userId: string,
  articleId: string,
): Promise<UserArticle | null> {
  const { data, error } = await supabase
    .from("user_articles")
    .select("*")
    .eq("user_id", userId)
    .eq("id", articleId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
}

export async function getSharedArticle(
  supabase: SupabaseClient<Database>,
  token: string,
): Promise<SharedArticle | null> {
  // Security-definer RPC: a valid share token grants read access to the
  // single linked article, which RLS would otherwise hide from anonymous
  // visitors.
  const { data, error } = await (supabase as any)
    .rpc("get_shared_article", { p_token: token })
    .maybeSingle();

  if (error) throw new Error(error.message);
  return (data as SharedArticle | null) ?? null;
}
