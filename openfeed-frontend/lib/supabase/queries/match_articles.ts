import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/lib/supabase/supabase.types";
import { scoreArticleRelevance } from "@/lib/bayesian";

export async function matchArticlesByEmbedding(
  supabase: SupabaseClient<Database>,
  embedding: number[],
  matchCount: number,
  minSimilarity: number,
): Promise<{ id: string; similarity: number }[]> {
  const { data: matches, error: rpcError } = await supabase.rpc(
    "match_articles",
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

export async function matchArticlesByEntities(
  supabase: SupabaseClient<Database>,
  entities: string[],
  matchCount: number,
  minJaccard: number,
): Promise<{ id: string; jaccard_score: number }[]> {
  const { data: matches, error: rpcError } = await supabase.rpc(
    "match_articles_by_entities",
    {
      query_entities: entities,
      match_count: matchCount,
      min_jaccard: minJaccard,
    },
  );

  if (rpcError) throw new Error(rpcError.message);
  if (!matches || matches.length === 0) return [];

  return matches.map((m) => ({ id: m.id, jaccard_score: m.jaccard_score }));
}

/**
 * Hybrid search combining semantic (embedding) and keyword (entity) matching.
 * Uses Bayesian inference to combine both signals into a single relevance score.
 *
 * @param supabase - Supabase client
 * @param embedding - Query embedding vector
 * @param keywords - Extracted query keywords/entities
 * @param matchCount - Number of results to return from each search method
 * @param minSimilarity - Minimum embedding similarity threshold
 * @param minJaccard - Minimum Jaccard similarity threshold for entities
 * @returns Articles sorted by Bayesian relevance score
 */
export async function matchArticlesHybrid(
  supabase: SupabaseClient<Database>,
  embedding: number[],
  keywords: string[],
  matchCount: number,
  minSimilarity: number,
  minJaccard: number = 0.1,
): Promise<{ id: string; relevance_score: number }[]> {
  // Run both searches in parallel
  const [embeddingMatches, entityMatches] = await Promise.all([
    matchArticlesByEmbedding(supabase, embedding, matchCount, minSimilarity),
    keywords.length > 0
      ? matchArticlesByEntities(supabase, keywords, matchCount, minJaccard)
      : Promise.resolve([]),
  ]);

  // Merge results and compute Bayesian relevance scores
  const scoreMap = new Map<string, { embedding: number | null; entity: number | null }>();

  for (const match of embeddingMatches) {
    scoreMap.set(match.id, { embedding: match.similarity, entity: null });
  }

  for (const match of entityMatches) {
    const existing = scoreMap.get(match.id);
    if (existing) {
      existing.entity = match.jaccard_score;
    } else {
      scoreMap.set(match.id, { embedding: null, entity: match.jaccard_score });
    }
  }

  // Compute Bayesian relevance for each article
  const results = Array.from(scoreMap.entries()).map(([id, scores]) => ({
    id,
    relevance_score: scoreArticleRelevance(scores.embedding, scores.entity),
  }));

  // Sort by relevance score (descending)
  results.sort((a, b) => b.relevance_score - a.relevance_score);

  return results;
}
