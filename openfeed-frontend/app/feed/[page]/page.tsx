import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { getUserInterests } from "@/lib/data/interests";

import {
  Article,
  getGlobalArticlesByPage,
  getGlobalArticlesBySearch,
} from "@/lib/backend";

import SearchBar from "@/components/Searchbar";
import { FeedDrawer } from "@/components/Navbar";
import { MenuDrawer } from "@/components/MenuDrawer";
import { ArticleCard } from "@/components/ArticleCard";

const PAGE_SIZE = 20;

function ArticleList({
  interests,
  articles,
  title,
  rightSlot,
  pagination,
}: {
  interests: { id: string; query: string }[];
  articles: Article[];
  title: string;
  rightSlot?: React.ReactNode;
  pagination?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col">
      <FeedDrawer
        left={<MenuDrawer interests={interests} />}
        center={<span className="text-xl font-semibold">{title}</span>}
        right={rightSlot}
      />
      <SearchBar />
      <div className="flex flex-col gap-2 p-4">
        {articles.length ? (
          articles.map((article) => (
            <ArticleCard key={article.id} article={article} />
          ))
        ) : (
          <p className="text-center text-base-content/50 py-8">
            No articles found.
          </p>
        )}
      </div>
      {pagination}
    </div>
  );
}

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
    <div className="flex justify-between p-4">
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
      <ArticleList
        interests={interests}
        articles={articles}
        title={query ? "Search Results" : "All Articles"}
        rightSlot={rightSlot}
        pagination={pagination}
      />
    </Suspense>
  );
}
