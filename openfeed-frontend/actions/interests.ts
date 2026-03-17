"use server";

import { createClient } from "@/lib/supabase/server";
import { embedText } from "@/lib/backend";

export async function addInterest(query: string) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data) throw new Error("Not authenticated");

  const { embeddings, model } = await embedText(query);
  const embeddingString = JSON.stringify(embeddings);

  const { data: interest, error } = await supabase
    .from("user_interests")
    .insert({
      user_id: data.claims.sub,
      query,
      embeddings: embeddingString,
      embedding_model: model,
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  await computeAndStoreScores(interest.id, data.claims.sub, embeddings);
}

export async function computeAndStoreScores(
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
