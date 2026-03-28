import Link from "next/link";
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
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  if (!claimsData) throw new Error("Not authenticated");
  const userId = claimsData.claims.sub;

  const { page: pageStr } = await params;
  const { query } = await searchParams;
  const page = parseInt(pageStr, 10);
  if (isNaN(page) || page < 1) notFound();

  const [interests, articles] = await Promise.all([
    getUserInterests(userId),
    query
      ? getGlobalArticlesBySearch(query)
      : getGlobalArticlesByPage(page, PAGE_SIZE),
  ]);

  const initialDrawerInterests: DrawerMenuInterest[] = interests.map((i) => ({
    interest: i,
    hasUnreadArticles: i.has_unread_articles,
  }));

  const rightSlot = query ? (
    <span className="text-base-content/50 pr-4">
      {articles.length} result{articles.length !== 1 && "s"}
    </span>
  ) : (
    <span className="text-base-content/50 pr-4">Page {page}</span>
  );

  const pagination = !query && (
    <div key="pagination" className="flex justify-between p-4">
      {page > 1 ? (
        <Link href={`/feed/${page - 1}`} className="btn">
          ← Previous
        </Link>
      ) : (
        <div />
      )}
      {articles.length === PAGE_SIZE ? (
        <Link href={`/feed/${page + 1}`} className="btn">
          Next →
        </Link>
      ) : (
        <div />
      )}
    </div>
  );

  return (
    <Suspense fallback={<ViewFeedSkeleton count={10} />}>
      <ViewFeed
        initialDrawerInterests={initialDrawerInterests}
        articles={articles}
        title={query ? "Search Results" : "All Articles"}
        rightSlot={rightSlot}
        pagination={pagination}
      />
    </Suspense>
  );
}
