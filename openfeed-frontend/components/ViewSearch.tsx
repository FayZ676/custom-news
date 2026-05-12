"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { QueryArticle } from "@/lib/supabase/queries/global_articles";
import { useUnreadCount } from "@/components/UnreadCountContext";

import SearchBar, { SearchbarSkeleton } from "@/components/Searchbar";
import { QuerySuggestions } from "@/components/QuerySuggestions";
import {
  SectionArticles,
  SectionArticleSkeleton,
} from "@/components/SectionArticles";

export interface ViewSearchProps {
  queryArticles: QueryArticle[];
  suggestions: string[];
  initialQuery?: string;
  handleSaveUserInterest: (query: string) => Promise<string>;
  handleCreateShareLink: (
    contentType: "article" | "story",
    contentId: string,
  ) => Promise<string>;
}

export function ViewSearch({
  queryArticles,
  suggestions,
  initialQuery = "",
  handleSaveUserInterest,
  handleCreateShareLink,
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
    adjustCount(queryArticles.length);
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
        ) : queryArticles.length > 0 ? (
          <SectionArticles
            articles={queryArticles}
            handleCreateShareLink={handleCreateShareLink}
          />
        ) : (
          <p className="text-sm italic text-neutral-500">
            No articles found matching your query. Try something more specific.
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
