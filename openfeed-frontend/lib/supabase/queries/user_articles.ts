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
  embedding: number[] | null;
}

// The get_shared_article RPC returns only the display columns.
export type SharedArticle = Omit<
  UserArticle,
  "user_id" | "embedding" | "search_vector"
>;

export interface PaginatedArticles {
  articles: UserArticle[];
  hasNextPage: boolean;
  totalPages: number;
}

interface UnifiedFeedPageParams {
  page: number;
  pageSize: number;
  queryText?: string;
}

const MIN_SEARCH_QUERY_LENGTH = 3;

async function embedQuery(query: string): Promise<number[] | null> {
  try {
    const response = await fetch("/api/search/embedding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
    });
    if (!response.ok) return null;
    const { embedding } = await response.json();
    return Array.isArray(embedding) ? embedding : null;
  } catch {
    // Semantic retrieval is best-effort; search degrades to lexical-only.
    return null;
  }
}

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
    embedding: article.embedding ? JSON.stringify(article.embedding) : null,
  }));

  const { error } = await (supabase as any)
    .from("user_articles")
    .upsert(rows, { onConflict: "user_id,url", ignoreDuplicates: true });

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

export async function getUnifiedFeedPage(
  supabase: SupabaseClient<Database>,
  { page, pageSize, queryText }: UnifiedFeedPageParams,
): Promise<PaginatedArticles> {
  const start = (page - 1) * pageSize;

  const normalizedQuery = queryText?.trim() ?? "";
  const activeQuery =
    normalizedQuery.length >= MIN_SEARCH_QUERY_LENGTH ? normalizedQuery : null;
  const queryEmbedding = activeQuery ? await embedQuery(activeQuery) : null;

  // RLS on user_articles scopes the search to the caller's own rows.
  const { data, error } = await (supabase as any).rpc(
    "search_articles_feed_page",
    {
      query_text: activeQuery,
      query_embedding: queryEmbedding ? JSON.stringify(queryEmbedding) : null,
      page_size: Math.max(1, pageSize),
      page_offset: Math.max(0, start),
    },
  );

  if (error) throw new Error(error.message);

  const rows =
    (data as Array<UserArticle & { total_count: number | null }>) ?? [];
  const totalCount = rows[0]?.total_count ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / Math.max(pageSize, 1)));

  return {
    articles: rows.map(({ total_count: _totalCount, ...article }) => article),
    hasNextPage: page < totalPages,
    totalPages,
  };
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
