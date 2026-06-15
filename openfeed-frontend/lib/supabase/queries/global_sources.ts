import { SupabaseClient } from "@supabase/supabase-js";

import { Database } from "@/lib/supabase/supabase.types";
import type { FeedDefinition } from "@/lib/providers/types";

type GlobalSourceRow = Pick<
  Database["public"]["Tables"]["global_sources"]["Row"],
  "key" | "label" | "feed_url"
>;

function toFeedDefinition(row: GlobalSourceRow): FeedDefinition {
  return { key: row.key, label: row.label, feedUrl: row.feed_url };
}

export async function getGlobalSources(
  supabase: SupabaseClient<Database>,
): Promise<FeedDefinition[]> {
  const { data, error } = await supabase
    .from("global_sources")
    .select("key, label, feed_url")
    .order("label", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []).map(toFeedDefinition);
}

export async function getGlobalSourcesByKeys(
  supabase: SupabaseClient<Database>,
  keys: string[],
): Promise<FeedDefinition[]> {
  if (keys.length === 0) return [];

  const { data, error } = await supabase
    .from("global_sources")
    .select("key, label, feed_url")
    .in("key", keys);

  if (error) throw new Error(error.message);
  return (data ?? []).map(toFeedDefinition);
}

export async function getGlobalSourceMap(
  supabase: SupabaseClient<Database>,
): Promise<Map<string, FeedDefinition>> {
  const sources = await getGlobalSources(supabase);
  return new Map(sources.map((source) => [source.key, source]));
}
