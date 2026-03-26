import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getGlobalArticlesByPage } from "@/lib/backend";
import { ArticleCard } from "@/components/ArticleCard";

const PAGE_SIZE = 20;

async function ArticlesContent({ page }: { page: number }) {
  const articles = await getGlobalArticlesByPage(page, PAGE_SIZE);

  return (
    <div className="flex flex-col">
      <div className="navbar bg-base-100 border-b border-base-300">
        <div className="navbar-start">
          <Link href="/feed" className="btn btn-ghost text-xl">
            OpenFeed
          </Link>
        </div>
        <div className="navbar-center">
          <span className="text-xl font-semibold">All Articles</span>
        </div>
        <div className="navbar-end">
          <span className="text-base-content/50 pr-4">Page {page}</span>
        </div>
      </div>
      <div className="flex flex-col gap-2 p-4">
        {articles?.length ? (
          articles.map((article) => (
            <ArticleCard
              key={article.id}
              article={{ ...article, global_feeds: null }}
            />
          ))
        ) : (
          <p className="text-center text-base-content/50 py-8">
            No articles available.
          </p>
        )}
      </div>
      <div className="flex justify-between p-4">
        {page > 1 ? (
          <Link href={`/feed/${page - 1}`} className="btn">
            ← Previous
          </Link>
        ) : (
          <div />
        )}
        {articles?.length === PAGE_SIZE ? (
          <Link href={`/feed/${page + 1}`} className="btn">
            Next →
          </Link>
        ) : (
          <div />
        )}
      </div>
    </div>
  );
}

export default async function AllArticlesPage({
  params,
}: {
  params: Promise<{ page: string }>;
}) {
  const { page: pageStr } = await params;
  const page = parseInt(pageStr, 10);
  if (isNaN(page) || page < 1) notFound();

  return (
    <Suspense
      fallback={<div className="p-8 text-center">Loading articles...</div>}
    >
      <ArticlesContent page={page} />
    </Suspense>
  );
}
