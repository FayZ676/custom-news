import { SupabaseClient } from "@supabase/supabase-js";

import { Database } from "@/lib/supabase/supabase.types";

export async function getUserSourceKeys(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<string[]> {
  const { data, error } = await supabase
    .from("user_sources")
    .select("source_key")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => row.source_key);
}

export async function getAllSourceKeysByUser(
  supabase: SupabaseClient<Database>,
): Promise<Map<string, string[]>> {
  const { data, error } = await supabase
    .from("user_sources")
    .select("user_id, source_key");

  if (error) throw new Error(error.message);

  const byUser = new Map<string, string[]>();
  for (const row of data ?? []) {
    const keys = byUser.get(row.user_id) ?? [];
    keys.push(row.source_key);
    byUser.set(row.user_id, keys);
  }
  return byUser;
}

export async function addUserSource(
  supabase: SupabaseClient<Database>,
  userId: string,
  sourceKey: string,
): Promise<void> {
  const { error } = await supabase
    .from("user_sources")
    .insert({ user_id: userId, source_key: sourceKey });

  if (error) throw new Error(error.message);
}

export async function removeUserSource(
  supabase: SupabaseClient<Database>,
  userId: string,
  sourceKey: string,
): Promise<void> {
  const { error } = await supabase
    .from("user_sources")
    .delete()
    .eq("user_id", userId)
    .eq("source_key", sourceKey);

  if (error) throw new Error(error.message);
}
