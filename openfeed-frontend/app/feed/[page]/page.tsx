import { Suspense } from "react";
import { notFound } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import {
  getUserInterests,
  getGlobalArticlesByPage,
  getGlobalArticlesBySearch,
} from "@/lib/backend";

import { ViewFeed } from "@/components/ViewFeed";
import { ViewFeedSkeleton } from "@/components/ViewFeedSkeleton";
import { DrawerMenuInterest } from "@/components/DrawerMenu";

const PAGE_SIZE = 20;

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
      ? getGlobalArticlesBySearch(supabase, query)
      : getGlobalArticlesByPage(supabase, page, PAGE_SIZE),
  ]);

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
      rightSlot={rightSlot}
      page={!query ? page : undefined}
      hasMore={!query ? articles.length === PAGE_SIZE : undefined}
    />
  );
}
