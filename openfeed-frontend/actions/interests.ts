"use server";

import { cacheTag, updateTag } from "next/cache";

import { createClient } from "@/lib/supabase/server";

export async function getUserInterests() {
  "use cache";

  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  if (!claimsData) throw new Error("Not authenticated");

  cacheTag(`interests:${claimsData.claims.sub}`);

  const { data, error } = await supabase
    .from("user_interests")
    .select("id, query")
    .eq("user_id", claimsData.claims.sub)
    .order("created_at");

  if (error) throw new Error(error.message);
  return data;
}

export async function addInterest(query: string): Promise<string> {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  if (!claimsData) throw new Error("Not authenticated");

  const { data: embedData, error: embedError } =
    await supabase.functions.invoke("embed", {
      body: { input: query },
    });

  if (embedError) throw new Error(embedError.message);

  const embeddings: number[] = embedData.embeddings[0];
  const model: string = embedData.model;
  const embeddingString = JSON.stringify(embeddings);

  const { data: interest, error } = await supabase
    .from("user_interests")
    .insert({
      user_id: claimsData.claims.sub,
      query,
      embeddings: embeddingString,
      embedding_model: model,
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);
  await computeAndStoreScores(interest.id, claimsData.claims.sub, embeddings);

  updateTag(`interests:${claimsData.claims.sub}`);

  return interest.id;
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

  updateTag(`interests:${data.claims.sub}`);

  if (error) throw new Error(error.message);
}

async function computeAndStoreScores(
  interestId: string,
  userId: string,
  embeddings: number[],
) {
  const supabase = await createClient();

  const { data: matches, error: rpcError } = await supabase.rpc(
    "match_articles",
    {
      query_embedding: JSON.stringify(embeddings),
      match_count: parseInt(process.env.MAX_ARTICLES_PER_INTEREST ?? "50"),
    },
  );

  if (rpcError) throw new Error(rpcError.message);

  const scores = matches.map((m: { id: string; similarity: number }) => ({
    user_id: userId,
    interest_id: interestId,
    article_id: m.id,
    score: m.similarity,
  }));

  const { error: insertError } = await supabase
    .from("user_article_scores")
    .insert(scores);

  if (insertError) throw new Error(insertError.message);
}
