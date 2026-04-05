import { Suspense } from "react";
import { notFound } from "next/navigation";
import { SupabaseClient } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";
import { Database } from "@/lib/supabase/supabase.types";

import { signOut } from "@/actions/auth";
import { rerankTexts } from "@/actions/reranker";
import { addInterest } from "@/actions/interests";
import { embedTexts } from "@/actions/embeddings";

import {
  UserArticleScore,
  getUserInterests,
  updateUserArticles,
  getGlobalArticlesByIds,
  matchArticlesByEmbedding,
  getUserSettings,
  updateUserNotificationSettings,
  getGlobalFeeds,
} from "@/lib/backend";

import { DrawerMenuProps } from "@/components/DrawerMenu";
import { ViewFeed, ViewFeedSkeleton } from "@/components/ViewFeed";

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
    articles.map((a) => a.global_articles.title),
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
    articles.map((a) => a.global_articles.title),
  );

  const scores: UserArticleScore[] = reranked
    .slice(0, articlesCount)
    .map((r) => ({
      user_id: userId,
      interest_id: interestId,
      article_id: articles[r.index].global_articles.id,
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

async function AllArticlesContent({ query }: { query?: string }) {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  if (!claimsData) throw new Error("Not authenticated");
  const userId = claimsData.claims.sub;

  const [feeds, interests, articles, userSettings] = await Promise.all([
    getGlobalFeeds(supabase),
    getUserInterests(supabase, userId),
    query ? searchGlobalArticles(supabase, query) : [],
    getUserSettings(supabase, userId),
  ]);

  async function handleSaveUserInterest(query: string) {
    "use server";
    const supabase = await createClient();
    return await saveUserInterest(supabase, query, userId);
  }

  async function handleUpdateNotifications() {
    "use server";
    const supabase = await createClient();
    await updateUserNotificationSettings(
      supabase,
      userId,
      !userSettings.email_notification,
    );
  }

  const drawerMenuProps: DrawerMenuProps = {
    userEmail: claimsData.claims.email,
    interests: interests.map((i) => ({
      interest: i,
      unreadArticlesCount: i.unread_articles_count,
    })),
    handleSignOut: signOut,
    settings: userSettings,
    handleUpdateNotifications: handleUpdateNotifications,
  };

  return (
    <ViewFeed
      feeds={feeds}
      drawerMenuProps={drawerMenuProps}
      articles={articles}
      title="The Latest Times"
      handleSaveUserInterest={handleSaveUserInterest}
      articlesPerInterest={ARTICLES_PER_PAGE}
    />
  );
}

export default async function AllArticlesPage({
  searchParams,
}: {
  searchParams: Promise<{ query?: string }>;
}) {
  const { query } = await searchParams;

  return (
    <Suspense fallback={<ViewFeedSkeleton />}>
      <AllArticlesContent query={query} />
    </Suspense>
  );
}
