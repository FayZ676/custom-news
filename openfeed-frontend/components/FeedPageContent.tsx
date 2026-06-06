"use client";

import { useCallback, useState } from "react";

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
  const [activeTopics, setActiveTopics] =
    useState<string[]>(initialActiveTopics);
  const [keywords, setKeywords] = useState<string[]>(initialKeywords);
  const [displayStories, setDisplayStories] =
    useState<StoryWithTopics[]>(stories);

  const handleChangeTopics = useCallback(
    async (nextTopics: string[]) => {
      setActiveTopics(nextTopics);
      try {
        await onChangeTopics(nextTopics);
      } catch {
        setActiveTopics(activeTopics);
      }
    },
    [activeTopics, onChangeTopics],
  );

  const handleChangeKeywords = useCallback(
    async (nextKeywords: string[]) => {
      setKeywords(nextKeywords);
      try {
        await onChangeKeywords(nextKeywords);
      } catch {
        setKeywords(keywords);
      }
    },
    [keywords, onChangeKeywords],
  );

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
      />
      <div className="pt-4">
        <ViewFeed stories={displayStories} />
      </div>
    </>
  );
}
