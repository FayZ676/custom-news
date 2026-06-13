"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import SearchFilterBar from "@/components/SearchFilterBar/SearchFilterBar";
import { ViewFeed, ViewFeedSkeleton } from "@/components/ViewFeed";
import { UserArticle } from "@/lib/supabase/queries/user_articles";
import {
  FeedArticle,
  MIN_SEARCH_QUERY_LENGTH,
  searchLatestNews,
} from "@/lib/newsSearch";
import { UserInterest } from "@/lib/supabase/queries/user_interests";
import { ingestForInterestAction } from "@/app/feed/actions";

interface FeedPageContentProps {
  articles: UserArticle[];
  interests: UserInterest[];
  userId: string;
}

export function FeedPageContent({
  articles,
  interests,
  userId,
}: FeedPageContentProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchArticles, setSearchArticles] = useState<FeedArticle[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isUpdatingFeed, setIsUpdatingFeed] = useState(false);
  const searchRequestIdRef = useRef(0);
  const isSearchActive = searchQuery.length >= MIN_SEARCH_QUERY_LENGTH;

  // When a new interest is added from the feed, fetch and store its articles
  // before refreshing, blocking the feed with a skeleton so the user sees the
  // update land rather than a stale or empty list.
  const handleInterestAdded = useCallback(
    async (interestText: string) => {
      setIsUpdatingFeed(true);
      try {
        await ingestForInterestAction(userId, interestText);
        router.refresh();
      } finally {
        setIsUpdatingFeed(false);
      }
    },
    [router, userId],
  );

  const handleSearchQueryChange = useCallback(async (query: string) => {
    setSearchQuery(query);
    if (query.length < MIN_SEARCH_QUERY_LENGTH) {
      setSearchArticles([]);
      setIsSearching(false);
    }
  }, []);

  // Live search hits NewsData.io directly (via /api/search/news) for fresh
  // articles matching the query, independent of the user's persisted feed.
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
        if (searchRequestIdRef.current === currentRequestId) setIsSearching(false);
      }
    };

    void run();
  }, [isSearchActive, searchQuery]);

  const displayedArticles = isSearchActive ? searchArticles : articles;

  return (
    <>
      <SearchFilterBar
        onSearchQueryChange={handleSearchQueryChange}
        interests={interests}
        userId={userId}
        onInterestsChange={() => router.refresh()}
        onInterestAdded={handleInterestAdded}
      />
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
