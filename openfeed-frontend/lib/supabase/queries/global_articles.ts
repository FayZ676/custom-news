import { SupabaseClient } from "@supabase/supabase-js";

import { Database, TablesInsert } from "@/lib/supabase/supabase.types";

export type NewGlobalArticle = TablesInsert<"global_articles">;

export interface ArticleToEmbed {
  id: string;
  title: string;
  summary: string | null;
}

export type MatchedArticle =
  Database["public"]["Functions"]["match_articles"]["Returns"][number];

export async function insertGlobalArticles(
  supabase: SupabaseClient<Database>,
  articles: NewGlobalArticle[],
): Promise<void> {
  if (articles.length === 0) return;

  const { error } = await supabase
    .from("global_articles")
    .upsert(articles, { onConflict: "url", ignoreDuplicates: true });

  if (error) throw new Error(error.message);
}

export async function getUnembeddedArticles(
  supabase: SupabaseClient<Database>,
): Promise<ArticleToEmbed[]> {
  const { data, error } = await supabase
    .from("global_articles")
    .select("id, title, summary")
    .is("embedding", null);

  if (error) throw new Error(error.message);
  return data;
}

export async function setArticleEmbedding(
  supabase: SupabaseClient<Database>,
  articleId: string,
  embedding: string,
): Promise<void> {
  const { error } = await supabase
    .from("global_articles")
    .update({ embedding })
    .eq("id", articleId);

  if (error) throw new Error(error.message);
}

export async function matchArticles(
  supabase: SupabaseClient<Database>,
  params: {
    embedding: string;
    since: string;
    minSimilarity: number;
    limit: number;
    // Skip articles already judged for this interest.
    interestId?: string;
  },
): Promise<MatchedArticle[]> {
  const { data, error } = await supabase.rpc("match_articles", {
    p_embedding: params.embedding,
    p_since: params.since,
    p_min_similarity: params.minSimilarity,
    p_limit: params.limit,
    p_interest_id: params.interestId,
  });

  if (error) throw new Error(error.message);
  return data;
}

export async function searchGlobalArticles(
  supabase: SupabaseClient<Database>,
  query: string,
  limit: number,
) {
  const { data, error } = await supabase
    .from("global_articles")
    .select("id, source_name, title, url, summary, image_url, published_at")
    .textSearch("search_vector", query, { type: "websearch" })
    .order("published_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);
  return data;
}
