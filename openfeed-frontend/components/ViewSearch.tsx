"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";

import { QueryArticle } from "@/lib/supabase/queries/global_articles";

import SearchBar, { SearchbarSkeleton } from "@/components/Searchbar";
import SearchbarTooltip from "@/components/SearchbarTooltip";
import {
  SectionArticles,
  SectionArticleSkeleton,
} from "@/components/SectionArticles";

export interface ViewSearchProps {
  queryArticles: QueryArticle[];
  handleSaveUserInterest: (query: string) => Promise<string>;
  handleCreateShareLink: (
    contentType: "article" | "story",
    contentId: string,
  ) => Promise<string>;
}

export function ViewSearch({
  queryArticles,
  handleSaveUserInterest,
  handleCreateShareLink,
}: ViewSearchProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [saved, setSaved] = useState(false);
  const [query, setQuery] = useState(searchParams.get("query") ?? "");
  const [saving, startSaveTransition] = useTransition();
  const [isSearching, startSearchTransition] = useTransition();

  const handleSearch = (q: string) => {
    startSearchTransition(() => {
      router.push(`/feed?tab=search&query=${encodeURIComponent(q)}`);
    });
  };

  const handleSave = (q: string) => {
    setSaved(false);
    startSaveTransition(async () => {
      await handleSaveUserInterest(q);
      setSaved(true);
      setQuery("");
      router.refresh();
      router.push("/feed?tab=search");
    });
  };

  const handleClear = () => {
    startSearchTransition(() => {
      setQuery("");
      router.push("/feed?tab=search");
    });
  };

  const activeQuery = searchParams.get("query");

  return (
    <div className="flex flex-col gap-4">
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
    <div className="flex flex-col gap-4">
      <SearchbarSkeleton />
      <div className="flex flex-col gap-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <SectionArticleSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
