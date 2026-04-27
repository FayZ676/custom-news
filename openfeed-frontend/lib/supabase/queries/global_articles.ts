import { SupabaseClient } from "@supabase/supabase-js";
import { Tables, Database } from "@/lib/supabase/supabase.types";

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

export async function getGlobalArticleById(
  supabase: SupabaseClient<Database>,
  id: string,
): Promise<Tables<"global_articles"> | null> {
  const { data, error } = await supabase
    .from("global_articles")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
}
