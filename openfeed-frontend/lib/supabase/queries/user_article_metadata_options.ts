import { SupabaseClient } from "@supabase/supabase-js";

import {
  MetadataOptionsByField,
} from "@/lib/supabase/queries/global_article_metadata_options";
import { Database } from "@/lib/supabase/supabase.types";

export interface UserArticleMetadataOption {
  user_id: string;
  field: "topic";
  name: string;
  created_at: string;
}

export async function getUserArticleMetadataOptions(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<UserArticleMetadataOption[]> {
  const { data, error } = await (supabase as any)
    .from("user_article_metadata_options")
    .select("user_id, field, name, created_at")
    .eq("user_id", userId)
    .eq("field", "topic")
    .order("name", { ascending: true });

  if (error) throw new Error(error.message);
  return (data as UserArticleMetadataOption[] | null) ?? [];
}

export async function addUserArticleMetadataOption(
  supabase: SupabaseClient<Database>,
  userId: string,
  field: "topic",
  name: string,
): Promise<void> {
  const { error } = await (supabase as any)
    .from("user_article_metadata_options")
    .upsert({
      user_id: userId,
      field,
      name,
    });

  if (error) throw new Error(error.message);
}

export async function removeUserArticleMetadataOption(
  supabase: SupabaseClient<Database>,
  userId: string,
  field: "topic",
  name: string,
): Promise<void> {
  const { error } = await (supabase as any)
    .from("user_article_metadata_options")
    .delete()
    .eq("user_id", userId)
    .eq("field", field)
    .eq("name", name);

  if (error) throw new Error(error.message);
}

export function groupUserMetadataByField(
  rows: UserArticleMetadataOption[],
): MetadataOptionsByField {
  const grouped: MetadataOptionsByField = {
    topic: [],
    type: [],
    coverage: [],
    duration: [],
    impact: [],
  };

  for (const row of rows) {
    grouped.topic.push(row.name);
  }

  return grouped;
}
