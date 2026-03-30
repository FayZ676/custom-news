"use server";

import { createClient } from "@/lib/supabase/server";
import { embedTexts } from "./embeddings";

interface AddInterestResponse {
  interestId: string;
  interestEmbeddings: number[];
}

export async function addInterest(query: string): Promise<AddInterestResponse> {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  if (!claimsData) throw new Error("Not authenticated");

  const embedData = await embedTexts([query]);
  const embeddings: number[] = embedData.embeddings[0];
  const embeddingString = JSON.stringify(embeddings);

  const { data: interest, error } = await supabase
    .from("user_interests")
    .insert({
      user_id: claimsData.claims.sub,
      query,
      embeddings: embeddingString,
      embedding_model: "",
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  return { interestId: interest.id, interestEmbeddings: embeddings };
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
