import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/lib/supabase/supabase.types";

export async function matchStoriesByEmbedding(
  supabase: SupabaseClient<Database>,
  embedding: number[],
  matchCount: number,
  minSimilarity: number,
): Promise<{ id: string; similarity: number }[]> {
  const { data: matches, error: rpcError } = await supabase.rpc(
    "match_stories",
    {
      query_embedding: JSON.stringify(embedding),
      match_count: matchCount,
      min_similarity: minSimilarity,
    },
  );

  if (rpcError) throw new Error(rpcError.message);
  if (!matches || matches.length === 0) return [];

  return matches.map((m) => ({ id: m.id, similarity: m.similarity }));
}
