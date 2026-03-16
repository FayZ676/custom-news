"use server";

import { createClient } from "@/lib/supabase/server";
import { embedText } from "@/lib/backend";

export async function addInterest(query: string) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data) throw new Error("Not authenticated");

  const { embeddings, model } = await embedText(query);

  const { error } = await supabase.from("user_interests").insert({
    user_id: data.claims.sub,
    query,
    embeddings,
    embedding_model: model,
  });

  if (error) throw new Error(error.message);
}

export async function deleteInterest(interestId: string) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("user_interests")
    .delete()
    .eq("id", interestId)
    .eq("user_id", data.claims.sub);

  if (error) throw new Error(error.message);
}
