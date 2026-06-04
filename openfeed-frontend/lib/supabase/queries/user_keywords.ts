import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/lib/supabase/supabase.types";

export async function getUserKeywords(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<Database["public"]["Tables"]["user_keywords"]["Row"][]> {
  const { data, error } = await supabase
    .from("user_keywords")
    .select("*")
    .eq("user_id", userId)
    .order("keywords", { ascending: true });

  if (error) throw new Error(error.message);
  return data;
}

export async function addUserKeyword(
  supabase: SupabaseClient<Database>,
  userId: string,
  keyword: string,
): Promise<Database["public"]["Tables"]["user_keywords"]["Row"]> {
  const { data, error } = await supabase
    .from("user_keywords")
    .insert({
      user_id: userId,
      keywords: keyword,
    })
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function removeUserKeyword(
  supabase: SupabaseClient<Database>,
  userId: string,
  keyword: string,
): Promise<void> {
  const { error } = await supabase
    .from("user_keywords")
    .delete()
    .eq("user_id", userId)
    .eq("keywords", keyword);

  if (error) throw new Error(error.message);
}
