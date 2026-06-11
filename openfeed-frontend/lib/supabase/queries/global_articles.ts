import { SupabaseClient } from "@supabase/supabase-js";

import { MetadataOptionsByField } from "@/lib/supabase/queries/global_article_metadata_options";
import { Database, Tables } from "@/lib/supabase/supabase.types";

export type GlobalArticle = Tables<"global_articles">;

export interface PaginatedArticles {
  articles: GlobalArticle[];
  hasNextPage: boolean;
  totalPages: number;
}

interface UnifiedFeedPageParams {
  page: number;
  pageSize: number;
  metadataFilters?: MetadataOptionsByField;
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

export async function getArticles(
  supabase: SupabaseClient<Database>,
): Promise<GlobalArticle[]> {
  const { data, error } = await supabase
    .from("global_articles")
    .select("*")
    .order("published_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data;
}

export async function getArticlesPage(
  supabase: SupabaseClient<Database>,
  page: number,
  pageSize: number,
  metadataFilters?: MetadataOptionsByField,
): Promise<PaginatedArticles> {
  return getUnifiedFeedPage(supabase, {
    page,
    pageSize,
    metadataFilters,
  });
}

export async function getUnifiedFeedPage(
  supabase: SupabaseClient<Database>,
  { page, pageSize, metadataFilters, queryText }: UnifiedFeedPageParams,
): Promise<PaginatedArticles> {
  const start = (page - 1) * pageSize;

  const normalizedQuery = queryText?.trim() ?? "";
  const activeQuery =
    normalizedQuery.length >= MIN_SEARCH_QUERY_LENGTH ? normalizedQuery : null;
  const queryEmbedding = activeQuery ? await embedQuery(activeQuery) : null;

  const { data, error } = await (supabase as any).rpc(
    "search_articles_feed_page",
    {
      query_text: activeQuery,
      query_embedding: queryEmbedding ? JSON.stringify(queryEmbedding) : null,
      topic_filters:
        metadataFilters?.topic && metadataFilters.topic.length > 0
          ? metadataFilters.topic
          : null,
      type_filters:
        metadataFilters?.type && metadataFilters.type.length > 0
          ? metadataFilters.type
          : null,
      coverage_filters:
        metadataFilters?.coverage && metadataFilters.coverage.length > 0
          ? metadataFilters.coverage
          : null,
      duration_filters:
        metadataFilters?.duration && metadataFilters.duration.length > 0
          ? metadataFilters.duration
          : null,
      impact_filters:
        metadataFilters?.impact && metadataFilters.impact.length > 0
          ? metadataFilters.impact
          : null,
      page_size: Math.max(1, pageSize),
      page_offset: Math.max(0, start),
    },
  );

  if (error) throw new Error(error.message);

  const rows =
    (data as Array<GlobalArticle & { total_count: number | null }>) ?? [];
  const totalCount = rows[0]?.total_count ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / Math.max(pageSize, 1)));

  return {
    articles: rows.map(({ total_count: _totalCount, ...article }) => article),
    hasNextPage: page < totalPages,
    totalPages,
  };
}

export async function getArticleById(
  supabase: SupabaseClient<Database>,
  id: string,
): Promise<GlobalArticle | null> {
  const { data, error } = await supabase
    .from("global_articles")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
}
