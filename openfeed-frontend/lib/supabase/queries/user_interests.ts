import { SupabaseClient } from "@supabase/supabase-js";

import { Database } from "@/lib/supabase/supabase.types";
import { NewsQueryPayload } from "@/lib/interests/refine";

export interface UserInterest {
  id: string;
  user_id: string;
  interest_text: string;
  query_payload: NewsQueryPayload | null;
  created_at: string;
}

export async function getUserInterests(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<UserInterest[]> {
  const { data, error } = await (supabase as any)
    .from("user_interests")
    .select("id, user_id, interest_text, query_payload, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);
  return (data as UserInterest[] | null) ?? [];
}

export interface UserInterestEntry {
  interestText: string;
  queryPayload: NewsQueryPayload | null;
}

export interface UserInterests {
  userId: string;
  interests: UserInterestEntry[];
}

export async function getAllInterestsByUser(
  supabase: SupabaseClient<Database>,
): Promise<UserInterests[]> {
  const { data, error } = await (supabase as any)
    .from("user_interests")
    .select("user_id, interest_text, query_payload");

  if (error) throw new Error(error.message);

  const byUser = new Map<string, UserInterestEntry[]>();
  for (const row of (data as { user_id: string; interest_text: string; query_payload: NewsQueryPayload | null }[]) ?? []) {
    const entries = byUser.get(row.user_id) ?? [];
    entries.push({ interestText: row.interest_text, queryPayload: row.query_payload });
    byUser.set(row.user_id, entries);
  }

  return [...byUser.entries()].map(([userId, interests]) => ({
    userId,
    interests,
  }));
}

export async function addUserInterest(
  supabase: SupabaseClient<Database>,
  userId: string,
  interestText: string,
  queryPayload?: NewsQueryPayload | null,
): Promise<UserInterest> {
  const { data, error } = await (supabase as any)
    .from("user_interests")
    .insert({
      user_id: userId,
      interest_text: interestText,
      query_payload: queryPayload ?? null,
    })
    .select("id, user_id, interest_text, query_payload, created_at")
    .single();

  if (error) throw new Error(error.message);
  return data as UserInterest;
}

export async function updateUserInterest(
  supabase: SupabaseClient<Database>,
  userId: string,
  interestId: string,
  interestText: string,
  queryPayload: NewsQueryPayload | null,
): Promise<UserInterest> {
  const { data, error } = await (supabase as any)
    .from("user_interests")
    .update({
      interest_text: interestText,
      query_payload: queryPayload,
    })
    .eq("user_id", userId)
    .eq("id", interestId)
    .select("id, user_id, interest_text, query_payload, created_at")
    .single();

  if (error) throw new Error(error.message);
  return data as UserInterest;
}

export async function removeUserInterest(
  supabase: SupabaseClient<Database>,
  userId: string,
  interestId: string,
): Promise<void> {
  const { error } = await (supabase as any)
    .from("user_interests")
    .delete()
    .eq("user_id", userId)
    .eq("id", interestId);

  if (error) throw new Error(error.message);
}
