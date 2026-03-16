"use server";

import { createClient } from "@/lib/supabase/server";

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

  if (error) throw new Error(error.message);
}
