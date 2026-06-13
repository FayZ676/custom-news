import { SupabaseClient } from "@supabase/supabase-js";

import { MetadataOptionsByField } from "@/lib/supabase/queries/global_article_metadata_options";
import { Database, Tables } from "@/lib/supabase/supabase.types";

export type UserArticle = Tables<"user_articles">;

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

export async function getUserArticles(
  supabase: SupabaseClient<Database>,
  userId: string,
  topicFilters?: string[],
): Promise<UserArticle[]> {
  let query = supabase
    .from("user_articles")
    .select("*")
    .eq("user_id", userId)
    .order("published_at", { ascending: false });

  if (topicFilters && topicFilters.length > 0) {
    query = query.in("topic", topicFilters);
  }

  const { data, error } = await query;

  if (error) throw new Error(error.message);
  return data;
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

  // RLS on user_articles scopes the search to the caller's own rows.
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
