import { SupabaseClient } from "@supabase/supabase-js";

import { Database } from "@/lib/supabase/supabase.types";

export interface UserInterest {
  id: string;
  user_id: string;
  interest_text: string;
  created_at: string;
}

export async function getUserInterests(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<UserInterest[]> {
  const { data, error } = await (supabase as any)
    .from("user_interests")
    .select("id, user_id, interest_text, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);
  return (data as UserInterest[] | null) ?? [];
}

export interface UserInterests {
  userId: string;
  interestTexts: string[];
}

export async function getAllInterestsByUser(
  supabase: SupabaseClient<Database>,
): Promise<UserInterests[]> {
  const { data, error } = await (supabase as any)
    .from("user_interests")
    .select("user_id, interest_text");

  if (error) throw new Error(error.message);

  const byUser = new Map<string, string[]>();
  for (const row of (data as { user_id: string; interest_text: string }[]) ?? []) {
    const texts = byUser.get(row.user_id) ?? [];
    texts.push(row.interest_text);
    byUser.set(row.user_id, texts);
  }

  return [...byUser.entries()].map(([userId, interestTexts]) => ({
    userId,
    interestTexts,
  }));
}

export async function addUserInterest(
  supabase: SupabaseClient<Database>,
  userId: string,
  interestText: string,
): Promise<UserInterest> {
  const { data, error } = await (supabase as any)
    .from("user_interests")
    .insert({
      user_id: userId,
      interest_text: interestText,
    })
    .select("id, user_id, interest_text, created_at")
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
