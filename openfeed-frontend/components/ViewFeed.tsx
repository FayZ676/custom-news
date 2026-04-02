"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Article } from "@/lib/backend";

import { useDrawerInterests } from "@/hooks/useDrawerInterest";

import SearchBar from "@/components/Searchbar";
import { Navbar } from "@/components/Navbar";
import { CardArticle } from "@/components/CardArticle";
import { CardArticleSkeleton } from "@/components/CardArticleSkeleton";
import { DrawerMenu, DrawerMenuProps } from "@/components/DrawerMenu";

export function ViewFeed({
  drawerMenuProps,
  articles,
  title,
  handleSaveUserInterest,
  articlesPerInterest,
  rightSlot,
  page,
  hasMore,
}: {
  drawerMenuProps: DrawerMenuProps;
  articles: Article[];
  title: string;
  handleSaveUserInterest: (query: string) => Promise<string>;
  articlesPerInterest: number;
  rightSlot?: React.ReactNode;
  page?: number;
  hasMore?: boolean;
}) {
  const router = useRouter();
  const [saved, setSaved] = useState(false);

  const { drawerInterests, addTempInterest, confirmInterest } =
    useDrawerInterests(drawerMenuProps.interests);

  const [saving, startSaveTransition] = useTransition();
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
    addTempInterest(tempId, query, articlesPerInterest);
    startSaveTransition(async () => {
      const interestId = await handleSaveUserInterest(query);
      confirmInterest(tempId, interestId, query, articlesPerInterest);
      setSaved(true);
    });
  };

  return (
    <div className="flex flex-col gap-8">
      <Navbar
        left={<DrawerMenu {...drawerMenuProps} interests={drawerInterests} />}
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
      <div className="flex flex-col gap-2">
        {isSearching ? (
          Array.from({ length: 3 }).map((_, i) => (
            <CardArticleSkeleton key={i} />
          ))
        ) : articles.length ? (
          articles.map((article) => (
            <CardArticle key={article.global_articles.id} article={article} />
          ))
        ) : (
          <p className="text-center text-base-content/50 py-8">
            No articles found.
          </p>
        )}
      </div>
      {page !== undefined && (
        <div className="flex justify-between">
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
