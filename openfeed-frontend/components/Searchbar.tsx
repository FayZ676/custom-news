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
    <div className="flex gap-2 items-center">
      <label className="input input-md sm:input-lg input-ghost w-full">
        <Search size={18} strokeWidth={3} className="opacity-50" />
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
  );
}
