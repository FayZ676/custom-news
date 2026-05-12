import { Suspense } from "react";
import { SupabaseClient } from "@supabase/supabase-js";

import { getAuthenticatedUser } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";
import { Database } from "@/lib/supabase/supabase.types";
import { embedTexts } from "@/lib/embeddings";
import { rerankTexts } from "@/lib/reranker";
import { generateQuerySuggestions } from "@/lib/suggestions";
import {
  getGlobalSettings,
  GlobalSettings,
} from "@/lib/supabase/queries/global_settings";
import { matchArticlesByEmbedding } from "@/lib/supabase/queries/match_articles";
import { getGlobalArticlesByIds } from "@/lib/supabase/queries/global_articles";
import { insertUserInterest } from "@/lib/supabase/queries/user_interests";
import {
  updateUserArticles,
  UserArticleScore,
} from "@/lib/supabase/queries/user_articles";
import { createShareLink } from "@/lib/supabase/queries/global_share_links";

import { ViewSearch, ViewSearchSkeleton } from "@/components/ViewSearch";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function searchGlobalArticles(
  supabase: SupabaseClient<Database>,
  query: string,
  settings: GlobalSettings,
) {
  const { embeddings } = await embedTexts([query]);
  const matches = await matchArticlesByEmbedding(
    supabase,
    embeddings[0],
    settings.max_match_count,
    settings.min_similarity_threshold,
  );
  if (matches.length === 0) return [];
  const articles = await getGlobalArticlesByIds(
    supabase,
    matches.map((m) => m.id),
  );
  const reranked = await rerankTexts(
    query,
    articles.map((a) => a.global_article.title),
  );
  return reranked.map((r) => articles[r.index]);
}

async function updateUserArticleScores(
  supabase: SupabaseClient<Database>,
  userId: string,
  interestId: string,
  interestQuery: string,
  interestEmbeddings: number[],
  settings: GlobalSettings,
) {
  const matches = await matchArticlesByEmbedding(
    supabase,
    interestEmbeddings,
    settings.max_match_count,
    settings.min_similarity_threshold,
  );
  if (matches.length === 0) return;

  const articles = await getGlobalArticlesByIds(
    supabase,
    matches.map((m) => m.id),
  );

  const reranked = await rerankTexts(
    interestQuery,
    articles.map((a) => a.global_article.title),
  );

  const scores: UserArticleScore[] = reranked.map((r) => ({
    user_id: userId,
    interest_id: interestId,
    article_id: articles[r.index].global_article.id,
    score: r.relevance_score,
  }));

  await updateUserArticles(supabase, scores);
}

async function saveUserInterest(
  supabase: Awaited<ReturnType<typeof createClient>>,
  query: string,
  userId: string,
  settings: GlobalSettings,
) {
  const response = await insertUserInterest(supabase, userId, query);
  await updateUserArticleScores(
    supabase,
    userId,
    response.interestId,
    query,
    response.interestEmbeddings,
    settings,
  );
  return response.interestId;
}

// ---------------------------------------------------------------------------
// Content component
// ---------------------------------------------------------------------------

async function ViewSearchContent({ query }: { query?: string }) {
  const { userId } = await getAuthenticatedUser();
  const supabase = await createClient();
  const settings = await getGlobalSettings(supabase);

  const [queryArticles, suggestions] = await Promise.all([
    query
      ? searchGlobalArticles(supabase, query, settings)
      : Promise.resolve([]),
    query ? generateQuerySuggestions(query) : Promise.resolve([]),
  ]);

  async function handleCreateShareLink(
    contentType: "article" | "story",
    contentId: string,
  ): Promise<string> {
    "use server";
    const supabase = await createClient();
    return await createShareLink(supabase, userId, contentType, contentId);
  }

  async function handleSaveUserInterest(query: string) {
    "use server";
    const supabase = await createClient();
    const settings = await getGlobalSettings(supabase);
    return await saveUserInterest(supabase, query, userId, settings);
  }

  return (
    <ViewSearch
      queryArticles={queryArticles}
      suggestions={suggestions}
      initialQuery={query ?? ""}
      handleCreateShareLink={handleCreateShareLink}
      handleSaveUserInterest={handleSaveUserInterest}
    />
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ query?: string }>;
}) {
  const { query } = await searchParams;

  return (
    <Suspense key={query ?? ""} fallback={<ViewSearchSkeleton />}>
      <ViewSearchContent query={query} />
    </Suspense>
  );
}
