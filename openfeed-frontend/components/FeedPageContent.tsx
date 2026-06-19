"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import SearchFilterBar from "@/components/SearchFilterBar/SearchFilterBar";
import { ViewFeed, ViewFeedSkeleton } from "@/components/ViewFeed";
import { UserArticle } from "@/lib/supabase/queries/user_articles";
import {
  FeedArticle,
  MIN_SEARCH_QUERY_LENGTH,
  searchLatestNews,
} from "@/lib/newsSearch";
import { UserInterest } from "@/lib/supabase/queries/user_interests";
import { markFeedSeenAction } from "@/app/feed/actions";

interface FeedPageContentProps {
  articles: UserArticle[];
  interests: UserInterest[];
  userId: string;
  readIds: string[];
  newIds: string[];
}

export function FeedPageContent({
  articles,
  interests,
  userId,
  readIds,
  newIds,
}: FeedPageContentProps) {
  const readIdSet = useMemo(() => new Set(readIds), [readIds]);
  const newIdSet = useMemo(() => new Set(newIds), [newIds]);

  useEffect(() => {
    void markFeedSeenAction(userId);
  }, [userId]);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchArticles, setSearchArticles] = useState<FeedArticle[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchRequestIdRef = useRef(0);
  const isSearchActive = searchQuery.length >= MIN_SEARCH_QUERY_LENGTH;

  const handleSearchQueryChange = useCallback((query: string) => {
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
  const showSearchLoading = isSearching && isSearchActive;
  const showSkeleton = showSearchLoading && searchArticles.length === 0;

  return (
    <>
      <SearchFilterBar
        interests={interests}
        onSearchQueryChange={handleSearchQueryChange}
        isSearching={showSearchLoading}
      />
      <div>
        {showSkeleton ? (
          <ViewFeedSkeleton />
        ) : (
          <div
            className={
              showSearchLoading
                ? "opacity-60 transition-opacity pointer-events-none"
                : "transition-opacity"
            }
          >
            <ViewFeed
              articles={displayedArticles}
              shareable={!isSearchActive}
              readIds={isSearchActive ? undefined : readIdSet}
              newIds={isSearchActive ? undefined : newIdSet}
              emptyStateMessage={
                isSearchActive
                  ? "No matches found."
                  : "You're all caught up. Check back later."
              }
            />
          </div>
        )}
      </div>
    </>
  );
}
