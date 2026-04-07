import Image from "next/image";
import { Suspense } from "react";

import { SupabaseClient } from "@supabase/supabase-js";

import { signOut } from "@/actions/auth";

import { createClient } from "@/lib/supabase/server";
import { Database } from "@/lib/supabase/supabase.types";

import { rerankTexts } from "@/actions/reranker";
import { addInterest } from "@/actions/interests";
import { embedTexts } from "@/actions/embeddings";
import { deleteInterest } from "@/actions/interests";

import {
  UserArticleScore,
  getUserInterestArticles,
  updateUserArticles,
  getGlobalArticlesByIds,
  matchArticlesByEmbedding,
  getUserSettings,
  updateUserNotificationSettings,
  getGlobalFeeds,
  InterestArticle,
  updateUserArticlesRead,
} from "@/lib/backend";

import { getCurrentDate } from "@/lib/utils";

import { Banner } from "@/components/Banner";
import { Footer, FooterSkeleton } from "@/components/Footer";
import { ViewFeed, ViewFeedSkeleton } from "@/components/ViewFeed";

const ARTICLES_PER_PAGE = 20;

async function searchGlobalArticles(
  supabase: SupabaseClient<Database>,
  query: string,
): Promise<InterestArticle[]> {
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
    articles.map((a) => a.global_article.title),
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
    articles.map((a) => a.global_article.title),
  );

  const scores: UserArticleScore[] = reranked
    .slice(0, articlesCount)
    .map((r) => ({
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

  const [feeds, interestArticles, queryArticles, userSettings] =
    await Promise.all([
      getGlobalFeeds(supabase),
      getUserInterestArticles(supabase, userId),
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

  async function handleReadArticles(articleIds: string[], isRead: boolean) {
    "use server";
    const supabase = await createClient();
    await updateUserArticlesRead(supabase, userId, articleIds, isRead);
  }

  async function handleDeleteInterest(interestId: string) {
    "use server";
    await deleteInterest(interestId);
  }

  return (
    <div className="flex flex-col gap-10">
      <div className="flex justify-center">
        <Image
          src={"logo.svg"}
          alt="The Latest Times"
          width={300}
          height={300}
          loading="eager"
          style={{ height: "auto" }}
        />
      </div>
      <Banner date={getCurrentDate()} feeds={feeds} />
      <ViewFeed
        feeds={feeds}
        queryArticles={queryArticles}
        interestArticles={interestArticles}
        handleDeleteInterest={handleDeleteInterest}
        handleReadUserArticles={handleReadArticles}
        handleSaveUserInterest={handleSaveUserInterest}
      />
      <Footer
        userEmail={claimsData.claims.email || ""}
        userSettings={userSettings}
        handleSignOut={signOut}
        handleUpdateNotifications={handleUpdateNotifications}
      />
    </div>
  );
}

export default async function AllArticlesPage({
  searchParams,
}: {
  searchParams: Promise<{ query?: string }>;
}) {
  const { query } = await searchParams;

  return (
    <Suspense fallback={<AllArticlesContentSkeleton />}>
      <AllArticlesContent query={query} />
    </Suspense>
  );
}

function AllArticlesContentSkeleton() {
  return (
    <div className="flex flex-col gap-10">
      <ViewFeedSkeleton />
      <FooterSkeleton />
    </div>
  );
}
