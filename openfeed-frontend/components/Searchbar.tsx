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
  const savedQueryRef = useRef<string | null>(null);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [placeholderVisible, setPlaceholderVisible] = useState(true);

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
    onSearch(query.trim());
  };

  const handleSave = () => {
    if (!query.trim() || saving) return;
    savedQueryRef.current = query.trim();
    onSave(query.trim());
  };

  const isSaved = saved && savedQueryRef.current === query.trim();

  const handleClear = () => {
    onQueryChange("");
    onClear();
  };

  return (
    <div className="flex flex-col gap-2 items-center w-full">
      <label className="input input-lg w-full rounded-none border-neutral-300">
        <Search size={18} strokeWidth={3} className="text-neutral-400" />
        <div className="relative grow">
          <input
            type="text"
            value={query}
            onChange={(e) => {
              const value = e.target.value;
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
            disabled={searching}
            className="w-full bg-transparent"
          />
          {!query && (
            <span
              className={`absolute inset-0 flex items-center pointer-events-none text-base-content/40 transition-opacity duration-300 overflow-hidden whitespace-nowrap ${
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
            disabled={searching}
            className="cursor-pointer"
          >
            <CircleX size={18} strokeWidth={3} className="opacity-50" />
          </button>
        )}
      </label>
      {query && (
        <button
          type="button"
          onClick={handleSave}
          disabled={!query.trim() || saving || isSaved || searching}
          className="cursor-pointer ml-auto px-2"
        >
          {saving ? (
            <span className="text-base-content/50 underline">Saving ...</span>
          ) : isSaved ? (
            <span className="font-extrabold underline">Query Saved</span>
          ) : (
            <span className="font-extrabold underline">Save Query</span>
          )}
        </button>
      )}
    </div>
  );
}

export function SearchbarSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      <div className="skeleton h-4 w-96 max-w-full rounded mx-auto" />
      <div className="flex gap-3 items-center w-full">
        <div className="skeleton input input-lg w-full rounded-none bg-[unset]!" />
      </div>
    </div>
  );
}
