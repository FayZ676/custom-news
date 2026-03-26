import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";

import {
  getGlobalArticlesByPage,
  getGlobalArticlesBySearch,
} from "@/lib/backend";
import { Tables } from "@/lib/supabase/supabase.types";

import SearchBar from "@/components/Searchbar";
import { FeedDrawer } from "@/components/FeedDrawer";
import { ArticleCard } from "@/components/ArticleCard";
import { MenuDrawerWithData } from "@/components/MenuDrawerWithData";

const PAGE_SIZE = 20;

function ArticleList({
  articles,
  title,
  rightSlot,
  pagination,
}: {
  articles: Tables<"global_articles">[];
  title: string;
  rightSlot?: React.ReactNode;
  pagination?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col">
      <FeedDrawer
        left={<MenuDrawerWithData />}
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
        articles={articles}
        title={query ? "Search Results" : "All Articles"}
        rightSlot={rightSlot}
        pagination={pagination}
      />
    </Suspense>
  );
}
