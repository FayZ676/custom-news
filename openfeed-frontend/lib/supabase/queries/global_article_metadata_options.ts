import { SupabaseClient } from "@supabase/supabase-js";

import { Database } from "@/lib/supabase/supabase.types";

export type ArticleMetadataField =
  | "topic"
  | "type"
  | "coverage"
  | "duration"
  | "impact";

export interface GlobalArticleMetadataOption {
  field: ArticleMetadataField;
  name: string;
  description: string;
}

export type MetadataOptionsByField = Record<ArticleMetadataField, string[]>;

const METADATA_FIELDS: ArticleMetadataField[] = [
  "topic",
  "type",
  "coverage",
  "duration",
  "impact",
];

export async function getGlobalArticleMetadataOptions(
  supabase: SupabaseClient<Database>,
): Promise<GlobalArticleMetadataOption[]> {
  const { data, error } = await (supabase as any)
    .from("global_article_metadata_options")
    .select("field, name, description")
    .order("field", { ascending: true })
    .order("name", { ascending: true });

  if (error) throw new Error(error.message);
  return ((data as GlobalArticleMetadataOption[] | null) ?? []).filter((row) =>
    METADATA_FIELDS.includes(row.field),
  );
}

export function groupMetadataOptionsByField(
  options: GlobalArticleMetadataOption[],
): MetadataOptionsByField {
  const empty: MetadataOptionsByField = {
    topic: [],
    type: [],
    coverage: [],
    duration: [],
    impact: [],
  };

  return options.reduce((acc, option) => {
    acc[option.field].push(option.name);
    return acc;
  }, empty);
}
