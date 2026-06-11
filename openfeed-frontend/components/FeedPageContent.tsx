"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import SearchFilterBar from "@/components/SearchFilterBar/SearchFilterBar";
import { ViewFeed } from "@/components/ViewFeed";
import { createClient as createBrowserSupabaseClient } from "@/lib/supabase/client";
import {
  getDigestFeed,
  getUnifiedFeedPage,
  GlobalArticle,
} from "@/lib/supabase/queries/global_articles";
import {
  ArticleMetadataField,
  MetadataOptionsByField,
} from "@/lib/supabase/queries/global_article_metadata_options";

const DIGEST_SIZE = 10;

interface FeedPageContentProps {
  articles: GlobalArticle[];
  metadataOptions: MetadataOptionsByField;
  initialMetadataFilters: MetadataOptionsByField;
  onChangeMetadataOptions: (
    field: ArticleMetadataField,
    optionNames: string[],
  ) => Promise<void>;
}

export function FeedPageContent({
  articles: initialArticles,
  metadataOptions,
  initialMetadataFilters,
  onChangeMetadataOptions,
}: FeedPageContentProps) {
  const router = useRouter();
  const [activeMetadataFilters, setActiveMetadataFilters] =
    useState<MetadataOptionsByField>(initialMetadataFilters);
  const [hasPendingFilterChanges, setHasPendingFilterChanges] = useState(false);
  const [pendingFilterSaveCount, setPendingFilterSaveCount] = useState(0);
  const [refreshOnFilterModalClose, setRefreshOnFilterModalClose] =
    useState(false);
  const [digestArticles, setDigestArticles] =
    useState<GlobalArticle[]>(initialArticles);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchArticles, setSearchArticles] = useState<GlobalArticle[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchRequestIdRef = useRef(0);
  const activeMetadataFiltersRef = useRef(activeMetadataFilters);
  const isSearchActive = searchQuery.length >= 3;

  useEffect(() => {
    setDigestArticles(initialArticles);
  }, [initialArticles]);

  useEffect(() => {
    activeMetadataFiltersRef.current = activeMetadataFilters;
  }, [activeMetadataFilters]);

  useEffect(() => {
    setActiveMetadataFilters(initialMetadataFilters);
  }, [initialMetadataFilters]);

  // Refresh digest on filter save
  useEffect(() => {
    if (!refreshOnFilterModalClose || pendingFilterSaveCount > 0) {
      return;
    }
    setHasPendingFilterChanges(false);
    setRefreshOnFilterModalClose(false);
    router.refresh();
  }, [pendingFilterSaveCount, refreshOnFilterModalClose, router]);

  // Subscribe to new article ingestions and silently refresh the digest
  useEffect(() => {
    const supabase = createBrowserSupabaseClient();
    const channel = supabase
      .channel("digest-refresh")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "global_articles" },
        () => {
          void getDigestFeed(supabase, {
            metadataFilters: activeMetadataFiltersRef.current,
            feedSize: DIGEST_SIZE,
          }).then(setDigestArticles);
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, []);

  const handleChangeFieldOptions = useCallback(
    async (field: ArticleMetadataField, nextOptions: string[]) => {
      const prevFilters = activeMetadataFilters;
      setActiveMetadataFilters((current) => ({
        ...current,
        [field]: nextOptions,
      }));
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

  const handleSearchQueryChange = useCallback((query: string) => {
    setSearchQuery(query);
    if (query.length < 3) {
      setSearchArticles([]);
      setIsSearching(false);
    }
  }, []);

  useEffect(() => {
    if (!isSearchActive) {
      return;
    }

    const currentRequestId = searchRequestIdRef.current + 1;
    searchRequestIdRef.current = currentRequestId;
    setIsSearching(true);

    const run = async () => {
      try {
        const supabase = createBrowserSupabaseClient();
        const result = await getUnifiedFeedPage(supabase, {
          page: 1,
          pageSize: DIGEST_SIZE,
          metadataFilters: activeMetadataFilters,
          queryText: searchQuery,
        });
        if (searchRequestIdRef.current !== currentRequestId) return;
        setSearchArticles(result.articles);
      } catch {
        if (searchRequestIdRef.current !== currentRequestId) return;
        setSearchArticles([]);
      } finally {
        if (searchRequestIdRef.current === currentRequestId) {
          setIsSearching(false);
        }
      }
    };

    void run();
  }, [activeMetadataFilters, isSearchActive, searchQuery]);

  const displayedArticles = isSearchActive ? searchArticles : digestArticles;

  return (
    <>
      <SearchFilterBar
        metadataOptions={metadataOptions}
        activeMetadataFilters={activeMetadataFilters}
        onChangeFieldOptions={handleChangeFieldOptions}
        onSearchQueryChange={handleSearchQueryChange}
        onFilterModalClose={handleFilterModalClose}
      />
      <div className="">
        {isSearching && isSearchActive ? (
          <p className="text-subtle italic">Searching...</p>
        ) : (
          <ViewFeed
            articles={displayedArticles}
            emptyStateMessage={isSearchActive ? "No matches found." : undefined}
          />
        )}
      </div>
    </>
  );
}
