import { SupabaseClient } from "@supabase/supabase-js";

import { Database } from "@/lib/supabase/supabase.types";
import type { FeedDefinition } from "@/lib/providers/types";

type SourceRow = Pick<
  Database["public"]["Tables"]["sources"]["Row"],
  "key" | "label" | "feed_url"
>;

function toFeedDefinition(row: SourceRow): FeedDefinition {
  return { key: row.key, label: row.label, feedUrl: row.feed_url };
}

export async function getSources(
  supabase: SupabaseClient<Database>,
): Promise<FeedDefinition[]> {
  const { data, error } = await supabase
    .from("sources")
    .select("key, label, feed_url")
    .order("label", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []).map(toFeedDefinition);
}

export async function getSourcesByKeys(
  supabase: SupabaseClient<Database>,
  keys: string[],
): Promise<FeedDefinition[]> {
  if (keys.length === 0) return [];

  const { data, error } = await supabase
    .from("sources")
    .select("key, label, feed_url")
    .in("key", keys);

  if (error) throw new Error(error.message);
  return (data ?? []).map(toFeedDefinition);
}

export async function getSourceMap(
  supabase: SupabaseClient<Database>,
): Promise<Map<string, FeedDefinition>> {
  const sources = await getSources(supabase);
  return new Map(sources.map((source) => [source.key, source]));
}
