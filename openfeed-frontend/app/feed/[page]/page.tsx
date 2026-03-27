import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import {
  getUserInterests,
  getGlobalArticlesByPage,
  getGlobalArticlesBySearch,
} from "@/lib/backend";

import { FeedView } from "@/components/ViewFeed";

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
  const interests = await getUserInterests(userId);

  const { page: pageStr } = await params;
  const { query } = await searchParams;
  const page = parseInt(pageStr, 10);
  if (isNaN(page) || page < 1) notFound();

  const articles = query
    ? await getGlobalArticlesBySearch(query)
    : await getGlobalArticlesByPage(page, PAGE_SIZE);

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
    <Suspense fallback={<div className="p-8 text-center">Loading…</div>}>
      <FeedView
        initialInterests={interests}
        articles={articles}
        title={query ? "Search Results" : "All Articles"}
        rightSlot={rightSlot}
        pagination={pagination}
      />
    </Suspense>
  );
}
