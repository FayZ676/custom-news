"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Article } from "@/lib/backend";
import { Database } from "@/lib/supabase/supabase.types";

import { useDrawerInterests } from "@/hooks/useDrawerInterest";

import { Navbar } from "@/components/Navbar";
import { Marquee } from "@/components/Marquee";
import SearchBar from "@/components/Searchbar";
import { NavbarSkeleton } from "@/components/Navbar";
import { SearchbarSkeleton } from "@/components/Searchbar";
import { DrawerMenu, DrawerMenuProps } from "@/components/DrawerMenu";
import { CardArticle, CardArticleSkeleton } from "@/components/CardArticle";

export function ViewFeed({
  feeds,
  drawerMenuProps,
  articles,
  title,
  handleSaveUserInterest,
  articlesPerInterest,
  rightSlot,
}: {
  feeds: Database["public"]["Tables"]["global_feeds"]["Row"][];
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
      router.push(`/feed?query=${encodeURIComponent(query)}`);
    });
  };

  const handleClear = () => {
    startSearchTransition(() => {
      router.push("/feed");
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
        center={<span className="text-xl font-semibold truncate">{title}</span>}
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
      {articles.length > 0 ? (
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
      ) : (
        <div className="flex flex-col gap-4">
          <span className="text-base-content/70">
            Sourcing the latest news from
          </span>
          <Marquee
            items={feeds}
            rows={4}
            duration={360}
            renderItem={(feed) => (
              <Link
                key={feed.id}
                href={feed.url}
                className="badge badge-md whitespace-nowra text-base-content/50 font-semibold"
              >
                {feed.title}
              </Link>
            )}
          />
        </div>
      )}
    </div>
  );
}

export function ViewFeedSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="flex flex-col gap-8">
      <NavbarSkeleton />
      <SearchbarSkeleton />
      <div className="flex flex-col gap-2">
        {Array.from({ length: count }).map((_, i) => (
          <CardArticleSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
