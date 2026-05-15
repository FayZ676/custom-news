"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Tables } from "@/lib/supabase/supabase.types";
import { useUnreadCount } from "@/components/UnreadCountContext";

import SearchBar, { SearchbarSkeleton } from "@/components/Searchbar";
import { QuerySuggestions } from "@/components/QuerySuggestions";
import { SectionArticleSkeleton } from "@/components/SectionArticles";
import { ViewTopStories } from "@/components/ViewTopStories";

export interface ViewSearchProps {
  queryStories: Tables<"global_stories">[];
  suggestions: string[];
  initialQuery?: string;
  handleSaveUserInterest: (query: string) => Promise<string>;
}

export function ViewSearch({
  queryStories,
  suggestions,
  initialQuery = "",
  handleSaveUserInterest,
}: ViewSearchProps) {
  const router = useRouter();

  const { adjustCount } = useUnreadCount();
  const [saved, setSaved] = useState(false);
  const [query, setQuery] = useState(initialQuery);
  const [saving, startSaveTransition] = useTransition();
  const [isSearching, startSearchTransition] = useTransition();

  const handleSearch = (q: string) => {
    setQuery(q);
    startSearchTransition(() => {
      router.push(`/feed/search?query=${encodeURIComponent(q)}`);
    });
  };

  const handleSave = (q: string) => {
    setSaved(false);
    adjustCount(queryStories.length);
    startSaveTransition(async () => {
      await handleSaveUserInterest(q);
      setSaved(true);
      setQuery("");
      router.refresh();
      router.push("/feed/search");
    });
  };

  const handleClear = () => {
    startSearchTransition(() => {
      setQuery("");
      router.push("/feed/search");
    });
  };

  const activeQuery = initialQuery;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        {/* <SearchbarTooltip /> */}
        <SearchBar
          query={query}
          saved={saved}
          saving={saving}
          searching={isSearching}
          onSave={handleSave}
          onClear={handleClear}
          onSearch={handleSearch}
          onQueryChange={setQuery}
        />
        <QuerySuggestions suggestions={suggestions} onSelect={handleSearch} />
      </div>

      {(isSearching || activeQuery) &&
        (isSearching ? (
          <>
            {Array.from({ length: 3 }).map((_, i) => (
              <SectionArticleSkeleton key={i} />
            ))}
          </>
        ) : queryStories.length > 0 ? (
          <ViewTopStories stories={queryStories} />
        ) : (
          <p className="text-sm italic text-neutral-500">
            No stories found matching your query. Try something more specific.
          </p>
        ))}
    </div>
  );
}

export function ViewSearchSkeleton() {
  return (
    <div className="flex flex-col gap-8">
      <SearchbarSkeleton />
      <div className="flex flex-col gap-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <SectionArticleSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
