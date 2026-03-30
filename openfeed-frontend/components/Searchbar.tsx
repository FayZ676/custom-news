"use client";

import { useSearchParams } from "next/navigation";
import { useState, useRef } from "react";
import {
  Search,
  Bookmark,
  BookmarkCheck,
  Loader2,
  CircleX,
} from "lucide-react";

interface SearchBarProps {
  onSave: (query: string) => void;
  saving: boolean;
  saved: boolean;
  onSearch: (query: string) => void;
  onClear: () => void;
  searching: boolean;
}

export default function SearchBar({
  onSave,
  saving,
  saved,
  onSearch,
  onClear,
  searching,
}: SearchBarProps) {
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("query") ?? "");
  const savedQueryRef = useRef<string | null>(null);

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
    setQuery("");
    onClear();
  };

  return (
    <div className="w-full p-4">
      <div className="relative rounded-lg border border-base-300 px-4 pt-4 pb-3">
        <label className="input input-ghost w-full">
          <Search size={16} strokeWidth={3} className="opacity-50" />
          <input
            type="text"
            value={query}
            onChange={(e) => {
              const value = e.target.value;
              setQuery(value);
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
            placeholder="Ask anything, or describe what you're looking for…"
            className="grow"
            disabled={searching}
          />
          {query && (
            <button
              type="button"
              onClick={handleClear}
              disabled={searching}
              className="cursor-pointer"
            >
              <CircleX size={16} strokeWidth={3} className="opacity-50" />
            </button>
          )}
        </label>

        <hr className="border-base-300 -mx-4 my-3" />

        <div className="flex flex-wrap items-center justify-end gap-2">
          <button
            type="button"
            onClick={handleSave}
            disabled={!query.trim() || saving || isSaved || searching}
            className="btn"
          >
            {saving ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>Saving...</span>
              </>
            ) : isSaved ? (
              <>
                <BookmarkCheck size={14} strokeWidth={3} />
                <span>Saved</span>
              </>
            ) : (
              <>
                <Bookmark size={14} strokeWidth={3} />
                <span>Save interest</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
