import { Suspense } from "react";
import { SupabaseClient } from "@supabase/supabase-js";

import { getAuthenticatedUser } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";
import { Database, Tables } from "@/lib/supabase/supabase.types";
import { embedTexts } from "@/lib/embeddings";
import { rerankTexts } from "@/lib/reranker";
import { generateQuerySuggestions } from "@/lib/suggestions";
import {
  getGlobalSettings,
  GlobalSettings,
} from "@/lib/supabase/queries/global_settings";
import { matchStoriesByEmbedding } from "@/lib/supabase/queries/match_stories";
import { getStoriesByIds } from "@/lib/supabase/queries/global_stories";
import { insertUserInterest } from "@/lib/supabase/queries/user_interests";
import {
  updateUserStories,
  UserStoryScore,
} from "@/lib/supabase/queries/user_stories";
import { createShareLink } from "@/lib/supabase/queries/global_share_links";

import { ViewSearch, ViewSearchSkeleton } from "@/components/ViewSearch";
import { ShareLinkProvider } from "@/components/ShareLinkContext";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function searchGlobalStories(
  supabase: SupabaseClient<Database>,
  query: string,
  settings: GlobalSettings,
): Promise<Tables<"global_stories">[]> {
  const { embeddings } = await embedTexts([query]);
  const matches = await matchStoriesByEmbedding(
    supabase,
    embeddings[0],
    settings.max_match_count,
    settings.min_similarity_threshold,
  );
  if (matches.length === 0) return [];
  const stories = await getStoriesByIds(
    supabase,
    matches.map((m) => m.id),
  );
  const reranked = await rerankTexts(
    query,
    stories.map((s) => s.headline),
  );
  return reranked.map((r) => stories[r.index]);
}

async function updateUserStoryScores(
  supabase: SupabaseClient<Database>,
  userId: string,
  interestId: string,
  interestQuery: string,
  interestEmbeddings: number[],
  settings: GlobalSettings,
) {
  const matches = await matchStoriesByEmbedding(
    supabase,
    interestEmbeddings,
    settings.max_match_count,
    settings.min_similarity_threshold,
  );
  if (matches.length === 0) return;

  const stories = await getStoriesByIds(
    supabase,
    matches.map((m) => m.id),
  );

  const reranked = await rerankTexts(
    interestQuery,
    stories.map((s) => s.headline),
  );

  const scores: UserStoryScore[] = reranked.map((r) => ({
    user_id: userId,
    interest_id: interestId,
    story_id: stories[r.index].id,
    score: r.relevance_score,
  }));

  await updateUserStories(supabase, scores);
}

async function saveUserInterest(
  supabase: Awaited<ReturnType<typeof createClient>>,
  query: string,
  userId: string,
  settings: GlobalSettings,
) {
  const response = await insertUserInterest(supabase, userId, query);
  await updateUserStoryScores(
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

  const [queryStories, suggestions] = await Promise.all([
    query
      ? searchGlobalStories(supabase, query, settings)
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
    <ShareLinkProvider handleCreateShareLink={handleCreateShareLink}>
      <ViewSearch
        queryStories={queryStories}
        suggestions={suggestions}
        initialQuery={query ?? ""}
        handleSaveUserInterest={handleSaveUserInterest}
      />
    </ShareLinkProvider>
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
