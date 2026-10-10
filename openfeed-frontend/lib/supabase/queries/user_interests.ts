import { SupabaseClient } from "@supabase/supabase-js";

import { Database } from "@/lib/supabase/supabase.types";

const INTEREST_COLUMNS = "id, user_id, interest_text, created_at";

export interface UserInterest {
  id: string;
  user_id: string;
  interest_text: string;
  created_at: string;
}

export interface EmbeddedUserInterest extends UserInterest {
  embedding: string | null;
}

export async function getUserInterests(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<UserInterest[]> {
  const { data, error } = await supabase
    .from("user_interests")
    .select(INTEREST_COLUMNS)
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);
  return data;
}

export async function getAllInterests(
  supabase: SupabaseClient<Database>,
): Promise<EmbeddedUserInterest[]> {
  const { data, error } = await supabase
    .from("user_interests")
    .select(`${INTEREST_COLUMNS}, embedding`);

  if (error) throw new Error(error.message);
  return data;
}

export async function getInterestById(
  supabase: SupabaseClient<Database>,
  interestId: string,
): Promise<EmbeddedUserInterest> {
  const { data, error } = await supabase
    .from("user_interests")
    .select(`${INTEREST_COLUMNS}, embedding`)
    .eq("id", interestId)
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function addUserInterest(
  supabase: SupabaseClient<Database>,
  userId: string,
  interestText: string,
): Promise<UserInterest> {
  const { data, error } = await supabase
    .from("user_interests")
    .insert({ user_id: userId, interest_text: interestText })
    .select(INTEREST_COLUMNS)
    .single();

  if (error) throw new Error(error.message);
  return data;
}

// Clears the embedding so the new text is re-embedded before matching.
export async function updateUserInterest(
  supabase: SupabaseClient<Database>,
  userId: string,
  interestId: string,
  interestText: string,
): Promise<UserInterest> {
  const { data, error } = await supabase
    .from("user_interests")
    .update({ interest_text: interestText, embedding: null })
    .eq("user_id", userId)
    .eq("id", interestId)
    .select(INTEREST_COLUMNS)
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function setInterestEmbedding(
  supabase: SupabaseClient<Database>,
  interestId: string,
  embedding: string,
): Promise<void> {
  const { error } = await supabase
    .from("user_interests")
    .update({ embedding })
    .eq("id", interestId);

  if (error) throw new Error(error.message);
}

export async function removeUserInterest(
  supabase: SupabaseClient<Database>,
  userId: string,
  interestId: string,
): Promise<void> {
  const { error } = await supabase
    .from("user_interests")
    .delete()
    .eq("user_id", userId)
    .eq("id", interestId);

  if (error) throw new Error(error.message);
}
