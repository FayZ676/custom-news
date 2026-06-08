import { SupabaseClient } from "@supabase/supabase-js";

import { MetadataOptionsByField } from "@/lib/supabase/queries/global_article_metadata_options";
import { Database, Tables } from "@/lib/supabase/supabase.types";

export type GlobalArticle = Tables<"global_articles">;

export interface PaginatedArticles {
  articles: GlobalArticle[];
  hasNextPage: boolean;
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
  const start = (page - 1) * pageSize;
  const end = start + pageSize;

  let query = (supabase as any)
    .from("global_articles")
    .select("*")
    .order("published_at", { ascending: false });

  const metadataFields: Array<keyof MetadataOptionsByField> = [
    "topic",
    "type",
    "coverage",
    "duration",
    "impact",
  ];

  for (const field of metadataFields) {
    const selected = metadataFilters?.[field] ?? [];
    if (selected.length > 0) {
      query = query.in(field, selected);
    }
  }

  const { data, error } = await query.range(start, end);

  if (error) throw new Error(error.message);

  const allRows = (data as GlobalArticle[] | null) ?? [];
  return {
    articles: allRows.slice(0, pageSize),
    hasNextPage: allRows.length > pageSize,
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
