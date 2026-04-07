"use client";

import { useRef } from "react";
import {
  Search,
  Bookmark,
  BookmarkCheck,
  Loader2,
  CircleX,
} from "lucide-react";

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
    <div className="flex flex-col gap-2 items-center">
      <span className="text-sm italic mr-auto">
        Interested in something specific? Search for it here!
      </span>
      <div className="flex gap-2 items-center w-full">
        <label className="input input-lg w-full rounded-none border-base-content">
          <Search size={18} strokeWidth={3} />
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
            placeholder="Ask anything ..."
            disabled={searching}
            className="grow"
          />
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
          <>
            {/* Icon-only circle button on small screens */}
            <button
              type="button"
              onClick={handleSave}
              disabled={!query.trim() || saving || isSaved || searching}
              className="btn btn-circle sm:hidden"
            >
              {saving ? (
                <Loader2 size={16} className="animate-spin" />
              ) : isSaved ? (
                <BookmarkCheck size={16} strokeWidth={3} />
              ) : (
                <Bookmark size={16} strokeWidth={3} />
              )}
            </button>
            {/* Full button with icon and text on sm+ screens */}
            <button
              type="button"
              onClick={handleSave}
              disabled={!query.trim() || saving || isSaved || searching}
              className="btn w-fit hidden sm:flex"
            >
              {saving ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Saving...</span>
                </>
              ) : isSaved ? (
                <>
                  <BookmarkCheck size={16} strokeWidth={3} />
                  <span>Saved</span>
                </>
              ) : (
                <>
                  <Bookmark size={16} strokeWidth={3} />
                  <span>Save</span>
                </>
              )}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export function SearchbarSkeleton() {
  return (
    <div className="flex gap-2 items-center">
      <div className="skeleton input input-lg w-full rounded-full bg-[unset]!" />
    </div>
  );
}
