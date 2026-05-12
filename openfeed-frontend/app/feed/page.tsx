import Link from "next/link";
import Image from "next/image";
import { Suspense } from "react";
import { SupabaseClient } from "@supabase/supabase-js";

import { signOut, getAuthenticatedUser } from "@/lib/supabase/auth";

import { createClient } from "@/lib/supabase/server";
import { createClient as createAnonClient } from "@supabase/supabase-js";
import { cacheLife } from "next/cache";
import { Database } from "@/lib/supabase/supabase.types";

import { rerankTexts } from "@/lib/reranker";
import { embedTexts } from "@/lib/embeddings";

import { getGlobalFeeds } from "@/lib/supabase/queries/global_feeds";
import { getUserSettings } from "@/lib/supabase/queries/user_settings";
import {
  updateUserArticlesRead,
  UserArticleScore,
} from "@/lib/supabase/queries/user_articles";
import { updateUserArticles } from "@/lib/supabase/queries/user_articles";
import { getGlobalArticlesByIds } from "@/lib/supabase/queries/global_articles";
import {
  getUserInterestArticles,
  insertUserInterest,
  deleteUserInterest,
} from "@/lib/supabase/queries/user_interests";
import {
  getGlobalSettings,
  GlobalSettings,
} from "@/lib/supabase/queries/global_settings";
import { matchArticlesByEmbedding } from "@/lib/supabase/queries/match_articles";
import { updateUserNotificationSettings } from "@/lib/supabase/queries/user_settings";
import { getStories } from "@/lib/supabase/queries/global_stories";
import { updateUserTheme } from "@/lib/supabase/queries/user_settings";
import { createShareLink } from "@/lib/supabase/queries/global_share_links";

import { getCurrentDate } from "@/lib/utils";

import { TabSwitcher } from "@/components/TabSwitcher";
import { UnreadCountProvider } from "@/components/UnreadCountContext";
import { Banner, BannerSkeleton } from "@/components/Banner";
import { Footer, FooterSkeleton } from "@/components/Footer";
import { ViewFeed, ViewFeedSkeleton } from "@/components/ViewFeed";
import {
  ViewTopStories,
  ViewTopStoriesSkeleton,
} from "@/components/ViewTopStories";
import { ViewSearch, ViewSearchSkeleton } from "@/components/ViewSearch";
import { generateQuerySuggestions } from "@/lib/suggestions";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Tab = "my-news" | "trending" | "search";

// ---------------------------------------------------------------------------
// Shared helpers
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
// Per-section async server components
// ---------------------------------------------------------------------------

function LogoSkeleton() {
  return <div className="skeleton h-16 w-75 rounded mx-auto" />;
}

async function LogoContent() {
  const { userId } = await getAuthenticatedUser();
  const supabase = await createClient();
  const userSettings = await getUserSettings(supabase, userId);
  return (
    <Link href="/" aria-label="Go to The Latest Times feed">
      <Image
        src={
          userSettings.color_theme === "cupcake"
            ? "/logo-light.svg"
            : "/logo-dark.svg"
        }
        alt="The Latest Times"
        width={300}
        height={300}
        loading="eager"
        style={{ height: "auto" }}
      />
    </Link>
  );
}

async function BannerContent({ date }: { date: string }) {
  "use cache";
  cacheLife("days");
  const supabase = createAnonClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
  const feeds = await getGlobalFeeds(supabase);
  return <Banner date={date} feeds={feeds} />;
}

async function ViewMyNewsContent() {
  const { userId } = await getAuthenticatedUser();
  const supabase = await createClient();
  const interestArticles = await getUserInterestArticles(supabase, userId);

  async function handleCreateShareLink(
    contentType: "article" | "story",
    contentId: string,
  ): Promise<string> {
    "use server";
    const supabase = await createClient();
    return await createShareLink(supabase, userId, contentType, contentId);
  }

  async function handleReadArticles(articleIds: string[], isRead: boolean) {
    "use server";
    const supabase = await createClient();
    await updateUserArticlesRead(supabase, userId, articleIds, isRead);
  }

  async function handleDeleteInterest(interestId: string) {
    "use server";
    const supabase = await createClient();
    await deleteUserInterest(supabase, userId, interestId);
  }

  return (
    <ViewFeed
      interestArticles={interestArticles}
      handleCreateShareLink={handleCreateShareLink}
      handleDeleteInterest={handleDeleteInterest}
      handleReadUserArticles={handleReadArticles}
    />
  );
}

async function ViewTrendingContent() {
  const { userId } = await getAuthenticatedUser();
  const supabase = await createClient();
  const stories = await getStories(supabase);

  async function handleCreateShareLink(
    contentType: "article" | "story",
    contentId: string,
  ): Promise<string> {
    "use server";
    const supabase = await createClient();
    return await createShareLink(supabase, userId, contentType, contentId);
  }

  return (
    <ViewTopStories
      stories={stories}
      handleCreateShareLink={handleCreateShareLink}
    />
  );
}

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
      handleCreateShareLink={handleCreateShareLink}
      handleSaveUserInterest={handleSaveUserInterest}
    />
  );
}

async function FooterContent() {
  const { userId, email } = await getAuthenticatedUser();
  const supabase = await createClient();
  const userSettings = await getUserSettings(supabase, userId);

  async function handleUpdateNotifications() {
    "use server";
    const supabase = await createClient();
    await updateUserNotificationSettings(
      supabase,
      userId,
      !userSettings.email_notification,
    );
  }

  async function handleUpdateTheme() {
    // ← add
    "use server";
    const supabase = await createClient();
    const next = userSettings.color_theme === "cupcake" ? "black" : "cupcake";
    await updateUserTheme(supabase, userId, next);
  }

  return (
    <Footer
      userEmail={email}
      userSettings={userSettings}
      handleSignOut={signOut}
      handleUpdateNotifications={handleUpdateNotifications}
      handleUpdateTheme={handleUpdateTheme} // ← add
    />
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function AllArticlesPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; query?: string }>;
}) {
  const { tab: rawTab, query } = await searchParams;
  const date = getCurrentDate();

  const tab: Tab =
    rawTab === "my-news" || rawTab === "search" ? rawTab : "trending";

  return (
    <div className="flex flex-col gap-4 flex-1">
      <div className="flex justify-center">
        <Suspense fallback={<LogoSkeleton />}>
          <LogoContent />
        </Suspense>
      </div>

      <BannerContent date={date} />

      <UnreadCountProvider initialCount={0}>
        <TabSwitcher />

        {tab === "trending" && (
          <Suspense fallback={<ViewTopStoriesSkeleton />}>
            <ViewTrendingContent />
          </Suspense>
        )}

        {tab === "my-news" && (
          <Suspense fallback={<ViewFeedSkeleton />}>
            <ViewMyNewsContent />
          </Suspense>
        )}

        {tab === "search" && (
          <Suspense key={query ?? ""} fallback={<ViewSearchSkeleton />}>
            <ViewSearchContent query={query} />
          </Suspense>
        )}
      </UnreadCountProvider>

      <div className="min-h-4 flex-1" />

      <Suspense fallback={<FooterSkeleton />}>
        <FooterContent />
      </Suspense>
    </div>
  );
}
