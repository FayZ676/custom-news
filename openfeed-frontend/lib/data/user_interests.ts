import { SupabaseClient } from "@supabase/supabase-js";
import { embedTexts } from "@/lib/embeddings";

export async function insertUserInterest(
  supabase: SupabaseClient,
  userId: string,
  query: string,
) {
  const embedData = await embedTexts([query]);
  const embeddings: number[] = embedData.embeddings[0];

  const { data: interest, error } = await supabase
    .from("user_interests")
    .insert({
      user_id: userId,
      query,
      embeddings: JSON.stringify(embeddings),
      embedding_model: "",
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);
  return { interestId: interest.id, interestEmbeddings: embeddings };
}

export async function deleteUserInterest(
  supabase: SupabaseClient,
  userId: string,
  interestId: string,
) {
  const { error } = await supabase
    .from("user_interests")
    .delete()
    .eq("id", interestId)
    .eq("user_id", userId);

  if (error) throw new Error(error.message);
}
