"use client";

import { useEffect, useRef, useState } from "react";
import { Search, CircleX } from "lucide-react";

const PLACEHOLDERS = [
  "What's happening in AI today",
  "Latest in climate policy",
  "Top tech stories this week",
  "New space exploration updates",
  "Recent breakthroughs in medicine",
  "Global economic trends this month",
  "Latest in renewable energy",
  "Developments in quantum computing",
  "World leaders in the news",
  "Emerging cybersecurity threats",
  "Breakthroughs in cancer research",
  "Updates on the housing market",
  "New findings in deep sea exploration",
  "Progress on Mars missions",
  "Latest in electric vehicle technology",
];

interface SearchBarProps {
  query: string;
  saving: boolean;
  saved: boolean;
  searching: boolean;
  onSave: (query: string) => void;
  onSearch: (query: string) => void;
  onClear: () => void;
  onQueryChange: (query: string) => void;
}

export default function SearchBar({
  query,
  saving,
  saved,
  searching,
  onSave,
  onClear,
  onSearch,
  onQueryChange,
}: SearchBarProps) {
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [placeholderVisible, setPlaceholderVisible] = useState(true);
  const [hasSearched, setHasSearched] = useState(!!query);

  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderVisible(false);
      setTimeout(() => {
        setPlaceholderIndex((prev) => (prev + 1) % PLACEHOLDERS.length);
        setPlaceholderVisible(true);
      }, 300);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleSearch = () => {
    if (!query.trim()) return;
    setHasSearched(true);
    onSearch(query.trim());
  };

  const handleSave = () => {
    if (!query.trim() || saving) return;
    onSave(query.trim());
  };

  const handleClear = () => {
    setHasSearched(false);
    onQueryChange("");
    onClear();
  };

  const showButton = !!query;
  const isAddToNews = hasSearched && !searching;
  const isSearching = searching;
  const isAdding = saving;

  const buttonLabel = isAdding
    ? "Adding..."
    : isAddToNews
      ? "Add to My News"
      : isSearching
        ? "Searching..."
        : "Search";

  const buttonDisabled = isSearching || isAdding || !query.trim();

  const handleButtonClick = isAddToNews ? handleSave : handleSearch;

  return (
    <div className="flex flex-col sm:flex-row gap-2 items-stretch w-full">
      <label className="input input-xl md:input-lg flex-1 rounded-none border-neutral-300 w-full">
        <Search size={18} strokeWidth={3} className="text-neutral-400" />
        <div className="relative grow">
          <input
            type="text"
            value={query}
            onChange={(e) => {
              const value = e.target.value;
              setHasSearched(false);
              onQueryChange(value);
              if (!value.trim()) {
                onClear();
              }
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleSearch();
              }
            }}
            placeholder=""
            disabled={searching || saving}
            className="w-full bg-transparent"
          />
          {!query && (
            <span
              className={`absolute inset-0 flex items-center pointer-events-none text-base-content/40 transition-opacity duration-300 overflow-hidden whitespace-nowrap [mask-image:linear-gradient(to_right,black_80%,transparent_100%)] ${
                placeholderVisible ? "opacity-100" : "opacity-0"
              }`}
            >
              {PLACEHOLDERS[placeholderIndex]}
            </span>
          )}
        </div>
        {query && (
          <button
            type="button"
            onClick={handleClear}
            disabled={searching || saving}
            className="cursor-pointer"
          >
            <CircleX size={18} strokeWidth={3} className="opacity-50" />
          </button>
        )}
      </label>

      {showButton && (
        <button
          type="button"
          onClick={handleButtonClick}
          disabled={buttonDisabled}
          className="cursor-pointer px-4 py-1 shrink-0 border-2 border-neutral-300 self-stretch flex items-center justify-center"
        >
          <span
            className={`${buttonDisabled ? "text-base-content/50" : "font-extrabold"}`}
          >
            {buttonLabel}
          </span>
        </button>
      )}
    </div>
  );
}

export function SearchbarSkeleton() {
  return (
    <div className="flex gap-2 items-stretch w-full">
      <div className="skeleton input input-lg flex-1 rounded-none bg-[unset]!" />
    </div>
  );
}
