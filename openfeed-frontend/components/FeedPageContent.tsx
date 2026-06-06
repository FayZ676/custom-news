"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import SearchFilterBar from "@/components/SearchFilterBar/SearchFilterBar";
import { ViewFeed } from "@/components/ViewFeed";
import { StoryWithTopics } from "@/lib/supabase/queries/global_stories";

interface FeedPageContentProps {
  stories: StoryWithTopics[];
  topics: string[];
  initialActiveTopics: string[];
  initialKeywords: string[];
  onChangeTopics: (topics: string[]) => Promise<void>;
  onChangeKeywords: (keywords: string[]) => Promise<void>;
  onSearchStories: (query: string) => Promise<StoryWithTopics[]>;
}

export function FeedPageContent({
  stories,
  topics,
  initialActiveTopics,
  initialKeywords,
  onChangeTopics,
  onChangeKeywords,
  onSearchStories,
}: FeedPageContentProps) {
  const router = useRouter();
  const [activeTopics, setActiveTopics] =
    useState<string[]>(initialActiveTopics);
  const [keywords, setKeywords] = useState<string[]>(initialKeywords);
  const [displayStories, setDisplayStories] =
    useState<StoryWithTopics[]>(stories);
  const [hasPendingFilterChanges, setHasPendingFilterChanges] = useState(false);
  const [pendingFilterSaveCount, setPendingFilterSaveCount] = useState(0);
  const [refreshOnFilterSheetClose, setRefreshOnFilterSheetClose] =
    useState(false);

  useEffect(() => {
    setDisplayStories(stories);
  }, [stories]);

  useEffect(() => {
    setActiveTopics(initialActiveTopics);
  }, [initialActiveTopics]);

  useEffect(() => {
    setKeywords(initialKeywords);
  }, [initialKeywords]);

  useEffect(() => {
    if (!refreshOnFilterSheetClose || pendingFilterSaveCount > 0) {
      return;
    }

    setHasPendingFilterChanges(false);
    setRefreshOnFilterSheetClose(false);
    router.refresh();
  }, [pendingFilterSaveCount, refreshOnFilterSheetClose, router]);

  const handleChangeTopics = useCallback(
    async (nextTopics: string[]) => {
      const prevTopics = activeTopics;
      setActiveTopics(nextTopics);
      setHasPendingFilterChanges(true);
      setPendingFilterSaveCount((count) => count + 1);
      try {
        await onChangeTopics(nextTopics);
      } catch {
        setActiveTopics(prevTopics);
        setHasPendingFilterChanges(false);
      } finally {
        setPendingFilterSaveCount((count) => Math.max(0, count - 1));
      }
    },
    [activeTopics, onChangeTopics],
  );

  const handleChangeKeywords = useCallback(
    async (nextKeywords: string[]) => {
      const prevKeywords = keywords;
      setKeywords(nextKeywords);
      setHasPendingFilterChanges(true);
      setPendingFilterSaveCount((count) => count + 1);
      try {
        await onChangeKeywords(nextKeywords);
      } catch {
        setKeywords(prevKeywords);
        setHasPendingFilterChanges(false);
      } finally {
        setPendingFilterSaveCount((count) => Math.max(0, count - 1));
      }
    },
    [keywords, onChangeKeywords],
  );

  const handleFilterSheetClose = useCallback(() => {
    if (!hasPendingFilterChanges) return;
    setRefreshOnFilterSheetClose(true);
  }, [hasPendingFilterChanges]);

  const handleSearchStories = useCallback(
    async (query: string) => {
      try {
        const nextStories = await onSearchStories(query);
        setDisplayStories(nextStories);
      } catch {
        setDisplayStories(stories);
      }
    },
    [onSearchStories, stories],
  );

  return (
    <>
      <SearchFilterBar
        topics={topics}
        activeTopics={activeTopics}
        keywords={keywords}
        onChangeTopics={handleChangeTopics}
        onChangeKeywords={handleChangeKeywords}
        onSearchStories={handleSearchStories}
        onFilterSheetClose={handleFilterSheetClose}
      />
      <div className="pt-4">
        <ViewFeed stories={displayStories} />
      </div>
    </>
  );
}
