"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition, useEffect, useOptimistic } from "react";

import { InterestArticles, QueryArticle } from "@/lib/backend";
import { Database } from "@/lib/supabase/supabase.types";
import { getCurrentDate, getUserLocation } from "@/lib/utils";

import SearchBar from "@/components/Searchbar";
import { NavbarSkeleton } from "@/components/Navbar";
import SectionInterest from "@/components/SectionInterest";
import {
  SectionArticles,
  SectionArticleSkeleton,
} from "@/components/SectionArticles";
import { SearchbarSkeleton } from "@/components/Searchbar";

export interface ViewFeedProps {
  feeds: Database["public"]["Tables"]["global_feeds"]["Row"][];
  queryArticles: QueryArticle[];
  interestArticles: InterestArticles[];
  handleDeleteInterest: (interestId: string) => Promise<void>;
  handleSaveUserInterest: (query: string) => Promise<string>;
  handleReadUserArticles: (
    articleIds: string[],
    isRead: boolean,
  ) => Promise<void>;
}

export function ViewFeed({
  feeds,
  queryArticles,
  interestArticles,
  handleDeleteInterest,
  handleReadUserArticles,
  handleSaveUserInterest,
}: ViewFeedProps) {
  const router = useRouter();

  const searchParams = useSearchParams();

  const [saved, setSaved] = useState(false);
  const [query, setQuery] = useState(searchParams.get("query") ?? "");

  const [saving, startSaveTransition] = useTransition();
  const [deleting, startDeleteTransition] = useTransition();
  const [isSearching, startSearchTransition] = useTransition();

  const [optimisticInterests, removeOptimisticInterest] = useOptimistic(
    interestArticles,
    (current: InterestArticles[], deletedId: string) =>
      current.filter((interest) => interest.id !== deletedId),
  );

  const handleSearch = (query: string) => {
    startSearchTransition(() => {
      router.push(`/feed?query=${encodeURIComponent(query)}`);
    });
  };

  const handleSave = (query: string) => {
    setSaved(false);
    startSaveTransition(async () => {
      await handleSaveUserInterest(query);
      setSaved(true);
      setQuery("");
      router.push("/feed");
    });
  };

  const handleDelete = (interestId: string) => {
    startDeleteTransition(async () => {
      removeOptimisticInterest(interestId);
      await handleDeleteInterest(interestId);
      router.refresh();
    });
  };

  const handleClear = () => {
    startSearchTransition(() => {
      router.push("/feed");
    });
  };

  const handleRead = async (articleIds: string[], isRead: boolean) => {
    await handleReadUserArticles(articleIds, isRead);
    router.refresh();
  };

  return (
    <div className="flex flex-col gap-6">
      <SearchBar
        query={query}
        saved={saved}
        saving={saving}
        searching={isSearching}
        onSave={handleSave}
        onClear={handleClear}
        onSearch={handleSearch}
        onQueryChange={setQuery}
      />
      {isSearching ? (
        <>
          {Array.from({ length: 3 }).map((_, i) => (
            <SectionArticleSkeleton key={i} />
          ))}
        </>
      ) : queryArticles.length > 0 ? (
        <SectionArticles articles={queryArticles} />
      ) : (
        <div className="flex flex-col">
          {optimisticInterests
            .slice()
            .sort((a, b) => {
              const aHasUnread = a.articles.some((article) => !article.is_read);
              const bHasUnread = b.articles.some((article) => !article.is_read);
              return Number(bHasUnread) - Number(aHasUnread);
            })
            .map((interest) => (
              <SectionInterest
                key={interest.id}
                interest={interest}
                deleting={deleting}
                handleDeleteInterest={handleDelete}
                handleReadArticles={handleRead}
              />
            ))}
        </div>
      )}
    </div>
  );
}

export function ViewFeedSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="flex flex-col gap-6">
      <NavbarSkeleton />
      <SearchbarSkeleton />
      <div className="flex flex-col gap-2">
        {Array.from({ length: count }).map((_, i) => (
          <SectionArticleSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
