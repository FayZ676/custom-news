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
import {
  ArticleMetadataField,
  MetadataOptionsByField,
} from "@/lib/supabase/queries/global_article_metadata_options";
import { UserInterest } from "@/lib/supabase/queries/user_interests";

interface FeedPageContentProps {
  articles: UserArticle[];
  metadataOptions: MetadataOptionsByField;
  initialMetadataFilters: MetadataOptionsByField;
  interests: UserInterest[];
  userId: string;
  onChangeMetadataOptions: (
    field: "topic",
    optionNames: string[],
  ) => Promise<void>;
}

export function FeedPageContent({
  articles,
  metadataOptions,
  initialMetadataFilters,
  interests,
  userId,
  onChangeMetadataOptions,
}: FeedPageContentProps) {
  const router = useRouter();
  const [activeMetadataFilters, setActiveMetadataFilters] =
    useState<MetadataOptionsByField>(initialMetadataFilters);
  const [hasPendingFilterChanges, setHasPendingFilterChanges] = useState(false);
  const [pendingFilterSaveCount, setPendingFilterSaveCount] = useState(0);
  const [refreshOnFilterModalClose, setRefreshOnFilterModalClose] =
    useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchArticles, setSearchArticles] = useState<FeedArticle[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchRequestIdRef = useRef(0);
  const isSearchActive = searchQuery.length >= MIN_SEARCH_QUERY_LENGTH;

  useEffect(() => {
    setActiveMetadataFilters(initialMetadataFilters);
  }, [initialMetadataFilters]);

  useEffect(() => {
    if (!refreshOnFilterModalClose || pendingFilterSaveCount > 0) return;
    setHasPendingFilterChanges(false);
    setRefreshOnFilterModalClose(false);
    router.refresh();
  }, [pendingFilterSaveCount, refreshOnFilterModalClose, router]);

  const handleChangeFieldOptions = useCallback(
    async (field: ArticleMetadataField, nextOptions: string[]) => {
      const prevFilters = activeMetadataFilters;
      setActiveMetadataFilters((current) => ({ ...current, [field]: nextOptions }));
      // Only topic selections are persisted; the database constrains
      // user_article_metadata_options to field = 'topic'. Other fields are
      // session-only filters applied client-side.
      if (field !== "topic") return;
      setHasPendingFilterChanges(true);
      setPendingFilterSaveCount((count) => count + 1);
      try {
        await onChangeMetadataOptions(field, nextOptions);
      } catch {
        setActiveMetadataFilters(prevFilters);
        setHasPendingFilterChanges(false);
      } finally {
        setPendingFilterSaveCount((count) => Math.max(0, count - 1));
      }
    },
    [activeMetadataFilters, onChangeMetadataOptions],
  );

  const handleFilterModalClose = useCallback(() => {
    if (!hasPendingFilterChanges) return;
    setRefreshOnFilterModalClose(true);
  }, [hasPendingFilterChanges]);

  const handleSearchQueryChange = useCallback(async (query: string) => {
    setSearchQuery(query);
    if (query.length < MIN_SEARCH_QUERY_LENGTH) {
      setSearchArticles([]);
      setIsSearching(false);
    }
  }, []);

  // Live search hits NewsData.io directly (via /api/search/news) for fresh
  // articles matching the query, independent of the user's persisted feed.
  // Metadata filters don't apply: these results aren't enriched.
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
        metadataOptions={metadataOptions}
        activeMetadataFilters={activeMetadataFilters}
        onChangeFieldOptions={handleChangeFieldOptions}
        onSearchQueryChange={handleSearchQueryChange}
        onFilterModalClose={handleFilterModalClose}
        interests={interests}
        userId={userId}
        onInterestsChange={() => router.refresh()}
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
                : "You're all caught up. Check back later."
            }
          />
        )}
      </div>
    </>
  );
}
