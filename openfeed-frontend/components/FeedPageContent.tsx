"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import SearchFilterBar from "@/components/SearchFilterBar/SearchFilterBar";
import { FeedPaginationNav } from "@/components/FeedPaginationNav";
import { ViewFeed } from "@/components/ViewFeed";
import { createClient as createBrowserSupabaseClient } from "@/lib/supabase/client";
import {
  getUnifiedFeedPage,
  GlobalArticle,
} from "@/lib/supabase/queries/global_articles";
import {
  ArticleMetadataField,
  MetadataOptionsByField,
} from "@/lib/supabase/queries/global_article_metadata_options";
import { UserInterest } from "@/lib/supabase/queries/user_interests";

const PAGE_SIZE = 10;

interface FeedPageContentProps {
  articles: GlobalArticle[];
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
  const [searchPage, setSearchPage] = useState(1);
  const [searchArticles, setSearchArticles] = useState<GlobalArticle[]>([]);
  const [searchTotalPages, setSearchTotalPages] = useState(1);
  const [searchHasNextPage, setSearchHasNextPage] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const searchRequestIdRef = useRef(0);
  const isSearchActive = searchQuery.length >= 3;

  useEffect(() => {
    setActiveMetadataFilters(initialMetadataFilters);
  }, [initialMetadataFilters]);

  useEffect(() => {
    if (!refreshOnFilterModalClose || pendingFilterSaveCount > 0) return;
    setHasPendingFilterChanges(false);
    setRefreshOnFilterModalClose(false);
    setSearchPage(1);
    router.refresh();
  }, [pendingFilterSaveCount, refreshOnFilterModalClose, router]);

  const handleChangeFieldOptions = useCallback(
    async (field: ArticleMetadataField, nextOptions: string[]) => {
      const prevFilters = activeMetadataFilters;
      setActiveMetadataFilters((current) => ({ ...current, [field]: nextOptions }));
      setSearchPage(1);
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
    setSearchPage(1);
    if (query.length < 3) {
      setSearchArticles([]);
      setSearchTotalPages(1);
      setSearchHasNextPage(false);
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
        const supabase = createBrowserSupabaseClient();
        const result = await getUnifiedFeedPage(supabase, {
          page: searchPage,
          pageSize: PAGE_SIZE,
          metadataFilters: activeMetadataFilters,
          queryText: searchQuery,
        });
        if (searchRequestIdRef.current !== currentRequestId) return;
        setSearchArticles(result.articles);
        setSearchTotalPages(result.totalPages);
        setSearchHasNextPage(result.hasNextPage);
      } catch {
        if (searchRequestIdRef.current !== currentRequestId) return;
        setSearchArticles([]);
        setSearchTotalPages(1);
        setSearchHasNextPage(false);
      } finally {
        if (searchRequestIdRef.current === currentRequestId) setIsSearching(false);
      }
    };

    void run();
  }, [activeMetadataFilters, isSearchActive, searchPage, searchQuery]);

  const handleSearchPageChange = useCallback(
    (nextPage: number) => {
      setSearchPage((current) => {
        if (nextPage < 1 || nextPage > searchTotalPages || nextPage === current) {
          return current;
        }
        return nextPage;
      });
    },
    [searchTotalPages],
  );

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
            emptyStateMessage={
              isSearchActive
                ? "No matches found."
                : "You're all caught up. Check back later."
            }
          />
        )}
      </div>
      {isSearchActive && (
        <FeedPaginationNav
          currentPage={searchPage}
          hasNextPage={searchHasNextPage}
          totalPages={searchTotalPages}
          onPageChange={handleSearchPageChange}
        />
      )}
    </>
  );
}
