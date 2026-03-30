import { Suspense } from "react";
import { notFound } from "next/navigation";
import { SupabaseClient } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";
import { Database } from "@/lib/supabase/supabase.types";

import { rerankTexts } from "@/actions/reranker";
import { addInterest } from "@/actions/interests";
import { embedTexts } from "@/actions/embeddings";

import {
  UserArticleScore,
  getUserInterests,
  updateUserArticles,
  getGlobalArticlesByIds,
  getGlobalArticlesByPage,
  matchArticlesByEmbedding,
} from "@/lib/backend";

import { ViewFeed } from "@/components/ViewFeed";
import { ViewFeedSkeleton } from "@/components/ViewFeedSkeleton";
import { DrawerMenuInterest } from "@/components/DrawerMenu";

const ARTICLES_PER_PAGE = 20;

async function searchGlobalArticles(
  supabase: Awaited<ReturnType<typeof createClient>>,
  query: string,
) {
  const { embeddings } = await embedTexts([query]);
  const matches = await matchArticlesByEmbedding(
    supabase,
    embeddings[0],
    ARTICLES_PER_PAGE * 2,
  );
  if (matches.length === 0) return [];
  const articles = await getGlobalArticlesByIds(
    supabase,
    matches.map((m) => m.id),
  );
  const rerankedArticleTexts = await rerankTexts(
    query,
    articles.map((a) => a.title),
  );
  return rerankedArticleTexts
    .map((r) => articles[r.index])
    .slice(0, ARTICLES_PER_PAGE);
}

async function updateUserArticleScores(
  supabase: SupabaseClient<Database>,
  userId: string,
  interestId: string,
  interestQuery: string,
  interestEmbeddings: number[],
  articlesCount: number,
) {
  const matches = await matchArticlesByEmbedding(
    supabase,
    interestEmbeddings,
    articlesCount * 2,
  );
  if (matches.length === 0) return;

  const articles = await getGlobalArticlesByIds(
    supabase,
    matches.map((m) => m.id),
  );

  const reranked = await rerankTexts(
    interestQuery,
    articles.map((a) => a.title),
  );

  const scores: UserArticleScore[] = reranked
    .slice(0, articlesCount)
    .map((r) => ({
      user_id: userId,
      interest_id: interestId,
      article_id: articles[r.index].id,
      score: r.relevance_score,
    }));

  await updateUserArticles(supabase, scores);
}

async function saveUserInterest(
  supabase: Awaited<ReturnType<typeof createClient>>,
  query: string,
  userId: string,
) {
  const response = await addInterest(query);
  await updateUserArticleScores(
    supabase,
    userId,
    response.interestId,
    query,
    response.interestEmbeddings,
    ARTICLES_PER_PAGE,
  );
  return response.interestId;
}

async function AllArticlesContent({
  page,
  query,
}: {
  page: number;
  query?: string;
}) {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  if (!claimsData) throw new Error("Not authenticated");
  const userId = claimsData.claims.sub;

  const [interests, articles] = await Promise.all([
    getUserInterests(supabase, userId),
    query
      ? searchGlobalArticles(supabase, query)
      : getGlobalArticlesByPage(supabase, page, ARTICLES_PER_PAGE),
  ]);

  async function handleSaveUserInterest(query: string) {
    "use server";
    const supabase = await createClient();
    const { data: claimsData } = await supabase.auth.getClaims();
    if (!claimsData) throw new Error("Not authenticated");
    const userId = claimsData.claims.sub;

    return await saveUserInterest(supabase, query, userId);
  }

  const initialDrawerInterests: DrawerMenuInterest[] = interests.map((i) => ({
    interest: i,
    unreadArticlesCount: i.unread_articles_count,
  }));

  const rightSlot = query ? (
    <span className="text-base-content/50 pr-4">
      {articles.length} result{articles.length !== 1 && "s"}
    </span>
  ) : (
    <span className="text-base-content/50 pr-4">Page {page}</span>
  );

  return (
    <ViewFeed
      initialDrawerInterests={initialDrawerInterests}
      articles={articles}
      title={query ? "Search Results" : "All Articles"}
      handleSaveUserInterest={handleSaveUserInterest}
      articlesPerInterest={ARTICLES_PER_PAGE}
      rightSlot={rightSlot}
      page={!query ? page : undefined}
      hasMore={!query ? articles.length === ARTICLES_PER_PAGE : undefined}
    />
  );
}

export default async function AllArticlesPage({
  params,
  searchParams,
}: {
  params: Promise<{ page: string }>;
  searchParams: Promise<{ query?: string }>;
}) {
  const { page: pageStr } = await params;
  const { query } = await searchParams;
  const page = parseInt(pageStr, 10);
  if (isNaN(page) || page < 1) notFound();

  return (
    <Suspense fallback={<ViewFeedSkeleton />}>
      <AllArticlesContent page={page} query={query} />
    </Suspense>
  );
}
