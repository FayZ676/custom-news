"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import SearchFilterBar from "@/components/SearchFilterBar/SearchFilterBar";
import { ViewFeed } from "@/components/ViewFeed";
import { UserArticle } from "@/lib/supabase/queries/user_articles";
import {
  FeedArticle,
  MIN_SEARCH_QUERY_LENGTH,
  searchLatestNews,
} from "@/lib/newsSearch";
import { UserInterest } from "@/lib/supabase/queries/user_interests";
import { refreshUserArticlesAction } from "@/app/feed/actions";

// A per-user refresh runs in the backend (NewsData fetch + embeddings), so a
// freshly built feed lands empty for a few seconds. Poll a bounded number of
// times before settling on the normal empty state.
const FEED_POLL_INTERVAL_MS = 5000;
const MAX_FEED_POLLS = 12;

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
  const searchRequestIdRef = useRef(0);
  const isSearchActive = searchQuery.length >= MIN_SEARCH_QUERY_LENGTH;

  const [pollCount, setPollCount] = useState(0);

  const handleSearchQueryChange = useCallback(async (query: string) => {
    setSearchQuery(query);
    if (query.length < MIN_SEARCH_QUERY_LENGTH) {
      setSearchArticles([]);
      setIsSearching(false);
    }
  }, []);

  // Changing interests rebuilds the feed in the backend; trigger the refresh
  // and restart polling so the new articles appear without a manual reload.
  const handleInterestsChange = useCallback(() => {
    void refreshUserArticlesAction();
    setPollCount(0);
    router.refresh();
  }, [router]);

  // While the feed is empty (e.g. right after onboarding), the backend refresh
  // is likely still in flight — re-fetch on an interval until articles arrive.
  const isFeedEmpty = articles.length === 0;
  const isBuildingFeed = isFeedEmpty && !isSearchActive && pollCount < MAX_FEED_POLLS;

  useEffect(() => {
    if (!isBuildingFeed) return;
    const timer = setTimeout(() => {
      setPollCount((count) => count + 1);
      router.refresh();
    }, FEED_POLL_INTERVAL_MS);
    return () => clearTimeout(timer);
  }, [isBuildingFeed, pollCount, router]);

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
        onInterestsChange={handleInterestsChange}
      />
      <div>
        {isSearching && isSearchActive ? (
          <p className="text-subtle italic">Searching...</p>
        ) : (
          <ViewFeed
            articles={displayedArticles}
            shareable={!isSearchActive}
            emptyStateMessage={
              isSearchActive
                ? "No matches found."
                : isBuildingFeed
                  ? "Putting together your feed — this can take a moment…"
                  : "You're all caught up. Check back later."
            }
          />
        )}
      </div>
    </>
  );
}
