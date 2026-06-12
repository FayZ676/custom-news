import { SupabaseClient } from "@supabase/supabase-js";

import { Database } from "@/lib/supabase/supabase.types";

export interface UserInterest {
  id: string;
  user_id: string;
  interest_text: string;
  embedding: number[] | null;
  created_at: string;
}

export async function getUserInterests(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<UserInterest[]> {
  const { data, error } = await (supabase as any)
    .from("user_interests")
    .select("id, user_id, interest_text, embedding, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);
  return (data as UserInterest[] | null) ?? [];
}

export async function addUserInterest(
  supabase: SupabaseClient<Database>,
  userId: string,
  interestText: string,
  embedding: number[] | null = null,
): Promise<UserInterest> {
  const { data, error } = await (supabase as any)
    .from("user_interests")
    .insert({
      user_id: userId,
      interest_text: interestText,
      embedding: embedding ? JSON.stringify(embedding) : null,
    })
    .select("id, user_id, interest_text, embedding, created_at")
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
