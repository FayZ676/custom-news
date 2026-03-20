"use server";

import { cacheTag, updateTag } from "next/cache";

import { createClient } from "@/lib/supabase/server";

export async function getUserCategories() {
  "use cache";

  const supabase = await createClient();
  const { data: claimsData, error: authError } =
    await supabase.auth.getClaims();
  if (authError || !claimsData) throw new Error("Not authenticated");

  cacheTag(`categories:${claimsData.claims.sub}`);

  const { data, error } = await supabase
    .from("user_category_subscriptions")
    .select("global_categories(id, name)");

  if (error) throw new Error(error.message);
  return data;
}

export async function subscribeToCategory(categoryId: string) {
  const supabase = await createClient();
  const { data, error: authError } = await supabase.auth.getClaims();
  if (authError || !data) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("user_category_subscriptions")
    .upsert(
      { user_id: data.claims.sub, category_id: categoryId },
      { onConflict: "user_id,category_id" },
    );

  updateTag(`categories:${data.claims.sub}`);

  if (error) throw new Error(error.message);
}

export async function unsubscribeFromCategory(categoryId: string) {
  const supabase = await createClient();
  const { data, error: authError } = await supabase.auth.getClaims();
  if (authError || !data) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("user_category_subscriptions")
    .delete()
    .eq("user_id", data.claims.sub)
    .eq("category_id", categoryId);

  updateTag(`categories:${data.claims.sub}`);

  if (error) throw new Error(error.message);
}
