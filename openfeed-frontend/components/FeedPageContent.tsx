"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import SearchFilterBar from "@/components/SearchFilterBar/SearchFilterBar";
import { ViewFeed } from "@/components/ViewFeed";
import { GlobalArticle } from "@/lib/supabase/queries/global_articles";
import {
  ArticleMetadataField,
  MetadataOptionsByField,
} from "@/lib/supabase/queries/global_article_metadata_options";

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
  articles,
  metadataOptions,
  initialMetadataFilters,
  onChangeMetadataOptions,
}: FeedPageContentProps) {
  const router = useRouter();
  const [activeMetadataFilters, setActiveMetadataFilters] =
    useState<MetadataOptionsByField>(initialMetadataFilters);
  const [hasPendingFilterChanges, setHasPendingFilterChanges] = useState(false);
  const [pendingFilterSaveCount, setPendingFilterSaveCount] = useState(0);
  const [refreshOnFilterSheetClose, setRefreshOnFilterSheetClose] =
    useState(false);

  useEffect(() => {
    setActiveMetadataFilters(initialMetadataFilters);
  }, [initialMetadataFilters]);

  useEffect(() => {
    if (!refreshOnFilterSheetClose || pendingFilterSaveCount > 0) {
      return;
    }

    setHasPendingFilterChanges(false);
    setRefreshOnFilterSheetClose(false);
    router.refresh();
  }, [pendingFilterSaveCount, refreshOnFilterSheetClose, router]);

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

  const handleFilterSheetClose = useCallback(() => {
    if (!hasPendingFilterChanges) return;
    setRefreshOnFilterSheetClose(true);
  }, [hasPendingFilterChanges]);

  return (
    <>
      <SearchFilterBar
        metadataOptions={metadataOptions}
        activeMetadataFilters={activeMetadataFilters}
        onChangeFieldOptions={handleChangeFieldOptions}
        onFilterSheetClose={handleFilterSheetClose}
      />
      <div className="pt-4">
        <ViewFeed articles={articles} />
      </div>
    </>
  );
}
