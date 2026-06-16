"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { TextAlignEnd } from "lucide-react";

import SearchBar from "@/components/SearchBar/SearchBar";
import FilterModal from "@/components/SearchBar/FilterModal";
import type { FilterModalHandle } from "@/components/SearchBar/FilterModal";
import { ViewFeed, ViewFeedSkeleton } from "@/components/ViewFeed";
import { UserArticle } from "@/lib/supabase/queries/user_articles";
import {
  FeedArticle,
  MIN_SEARCH_QUERY_LENGTH,
  searchLatestNews,
} from "@/lib/newsSearch";
import { UserInterest } from "@/lib/supabase/queries/user_interests";
import type { FeedDefinition } from "@/lib/providers/types";
import { ingestForInterestAction, rebuildFeedAction } from "@/app/feed/actions";

interface FeedPageContentProps {
  articles: UserArticle[];
  interests: UserInterest[];
  sources: FeedDefinition[];
  subscribedSourceKeys: string[];
  userId: string;
}

export function FeedPageContent({
  articles,
  interests,
  sources,
  subscribedSourceKeys,
  userId,
}: FeedPageContentProps) {
  const router = useRouter();
  const filterModalRef = useRef<FilterModalHandle>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchArticles, setSearchArticles] = useState<FeedArticle[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isAddingInterest, startAddingInterest] = useTransition();
  const [isRemovingInterest, startRemovingInterest] = useTransition();
  const [isUpdatingSources, startUpdatingSources] = useTransition();
  const searchRequestIdRef = useRef(0);
  const isSearchActive = searchQuery.length >= MIN_SEARCH_QUERY_LENGTH;

  const handleInterestAdded = useCallback(
    async (interest: UserInterest) => {
      startAddingInterest(async () => {
        await ingestForInterestAction(userId, interest);
        router.refresh();
      });
    },
    [router, userId],
  );

  const handleInterestRemoved = useCallback(async () => {
    startRemovingInterest(async () => {
      await rebuildFeedAction(userId);
      router.refresh();
    });
  }, [router, userId]);

  const handleSourcesChanged = useCallback(async () => {
    startUpdatingSources(async () => {
      await rebuildFeedAction(userId);
      router.refresh();
    });
  }, [router, userId]);

  const handleSearchQueryChange = useCallback(async (query: string) => {
    setSearchQuery(query);
    if (query.length < MIN_SEARCH_QUERY_LENGTH) {
      setSearchArticles([]);
      setIsSearching(false);
    }
  }, []);

  useEffect(() => {
    if (!isSearchActive) return;

    const currentRequestId = searchRequestIdRef.current + 1;
    searchRequestIdRef.current = currentRequestId;
    setIsSearching(true);

    const run = async () => {
      try {
        const articles = await searchLatestNews(searchQuery);
        if (searchRequestIdRef.current !== currentRequestId) return;
        setSearchArticles(articles);
      } catch {
        if (searchRequestIdRef.current !== currentRequestId) return;
        setSearchArticles([]);
      } finally {
        if (searchRequestIdRef.current === currentRequestId)
          setIsSearching(false);
      }
    };

    void run();
  }, [isSearchActive, searchQuery]);

  const displayedArticles = isSearchActive ? searchArticles : articles;
  const isUpdatingFeed =
    isAddingInterest || isRemovingInterest || isUpdatingSources;

  return (
    <>
      <div className="sticky top-0 z-30 bg-base-100 py-4 border-b border-base-300">
        <div className="flex justify-end mb-3">
          <button
            onClick={() => filterModalRef.current?.open()}
            className="btn-soft h-9.5"
          >
            <span className="hidden sm:inline">Filters</span>
            <TextAlignEnd size={16} />
          </button>
        </div>
        <SearchBar onSearchQueryChange={handleSearchQueryChange} />
        <FilterModal
          ref={filterModalRef}
          interests={interests}
          userId={userId}
          sources={sources}
          subscribedSourceKeys={subscribedSourceKeys}
          onInterestAdded={handleInterestAdded}
          onInterestRemoved={handleInterestRemoved}
          onSourcesChanged={handleSourcesChanged}
        />
      </div>
      <div>
        {isUpdatingFeed ? (
          <>
            <p className="text-subtle italic mb-4">Updating feed…</p>
            <ViewFeedSkeleton />
          </>
        ) : isSearching && isSearchActive ? (
          <p className="text-subtle italic">Searching...</p>
        ) : (
          <ViewFeed
            articles={displayedArticles}
            shareable={!isSearchActive}
            emptyStateMessage={
              isSearchActive
                ? "No matches found."
                : "You're all caught up. Check back later."
            }
          />
        )}
      </div>
    </>
  );
}
