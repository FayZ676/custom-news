"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Article } from "@/lib/backend";

import SearchBar from "@/components/Searchbar";
import { Navbar } from "@/components/Navbar";
import { CardArticle } from "@/components/CardArticle";
import { CardArticleSkeleton } from "@/components/CardArticleSkeleton";
import { DrawerMenu, DrawerMenuInterest } from "@/components/DrawerMenu";

export function ViewFeed({
  initialDrawerInterests,
  articles,
  title,
  handleSaveUserInterest,
  articlesPerInterest,
  rightSlot,
  page,
  hasMore,
}: {
  initialDrawerInterests: DrawerMenuInterest[];
  articles: Article[];
  title: string;
  handleSaveUserInterest: (query: string) => Promise<string>;
  articlesPerInterest: number;
  rightSlot?: React.ReactNode;
  page?: number;
  hasMore?: boolean;
}) {
  const router = useRouter();
  const [drawerInterests, setDrawerInterests] = useState<DrawerMenuInterest[]>(
    initialDrawerInterests,
  );
  const [saving, startSaveTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [isSearching, startSearchTransition] = useTransition();

  const handleSearch = (query: string) => {
    startSearchTransition(() => {
      router.push(`/feed/1?query=${encodeURIComponent(query)}`);
    });
  };

  const handleClear = () => {
    startSearchTransition(() => {
      router.push("/feed/1");
    });
  };

  const handleSave = (query: string) => {
    const tempId = `temp-${Date.now()}`;
    setSaved(false);
    setDrawerInterests((prev) => [
      ...prev,
      {
        interest: { id: tempId, query, unread_articles_count: 0 },
        unreadArticlesCount: articlesPerInterest,
      },
    ]);
    startSaveTransition(async () => {
      const interestId = await handleSaveUserInterest(query);
      setDrawerInterests((prev) =>
        prev.map((di) =>
          di.interest.id === tempId
            ? {
                ...di,
                interest: {
                  id: interestId,
                  query,
                  unread_articles_count: 0,
                },
                unreadArticlesCount: articlesPerInterest,
              }
            : di,
        ),
      );
      setSaved(true);
    });
  };

  return (
    <div className="flex flex-col">
      <Navbar
        left={<DrawerMenu interests={drawerInterests} />}
        center={<span className="text-xl font-semibold">{title}</span>}
        right={rightSlot}
      />
      <SearchBar
        onSave={handleSave}
        saving={saving}
        saved={saved}
        onSearch={handleSearch}
        onClear={handleClear}
        searching={isSearching}
      />
      <div className="flex flex-col gap-2 p-4">
        {isSearching ? (
          Array.from({ length: 3 }).map((_, i) => (
            <CardArticleSkeleton key={i} />
          ))
        ) : articles.length ? (
          articles.map((article) => (
            <CardArticle key={article.id} article={article} />
          ))
        ) : (
          <p className="text-center text-base-content/50 py-8">
            No articles found.
          </p>
        )}
      </div>
      {page !== undefined && (
        <div className="flex justify-between p-4">
          {page > 1 ? (
            <Link
              href={`/feed/${page - 1}`}
              className={`btn${isSearching || saving ? " btn-disabled" : ""}`}
              aria-disabled={isSearching || saving}
              tabIndex={isSearching || saving ? -1 : undefined}
              onClick={
                isSearching || saving ? (e) => e.preventDefault() : undefined
              }
            >
              ← Previous
            </Link>
          ) : (
            <div />
          )}
          {hasMore ? (
            <Link
              href={`/feed/${page + 1}`}
              className={`btn${isSearching || saving ? " btn-disabled" : ""}`}
              aria-disabled={isSearching || saving}
              tabIndex={isSearching || saving ? -1 : undefined}
              onClick={
                isSearching || saving ? (e) => e.preventDefault() : undefined
              }
            >
              Next →
            </Link>
          ) : (
            <div />
          )}
        </div>
      )}
    </div>
  );
}
