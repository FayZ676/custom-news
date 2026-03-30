"use client";

import { useSearchParams } from "next/navigation";
import { useState, useRef, useEffect } from "react";
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
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mirrorRef = useRef<HTMLDivElement>(null);
  const savedQueryRef = useRef<string | null>(null);

  useEffect(() => {
    if (mirrorRef.current && textareaRef.current) {
      mirrorRef.current.textContent = query + "\u200b";
      textareaRef.current.style.height = mirrorRef.current.offsetHeight + "px";
    }
  }, [query]);

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
        <div
          ref={mirrorRef}
          aria-hidden="true"
          className="absolute invisible pointer-events-none whitespace-pre-wrap break-words text-sm leading-relaxed"
          style={{ width: "calc(100% - 2rem)" }}
        />

        <textarea
          ref={textareaRef}
          value={query}
          onChange={(e) => {
            const value = e.target.value;
            setQuery(value);
            if (!value.trim()) {
              onClear();
            }
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSearch();
            }
          }}
          rows={1}
          spellCheck={false}
          placeholder="Ask anything, or describe what you're looking for…"
          className="w-full bg-transparent border-none outline-none resize-none overflow-hidden leading-relaxed placeholder:text-base-content/50 min-h-[24px]"
        />

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
                <BookmarkCheck size={14} />
                <span>Saved</span>
              </>
            ) : (
              <>
                <Bookmark size={14} />
                <span>Save as Interest</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleSearch}
            disabled={!query.trim() || searching}
            className="btn"
          >
            <Search size={14} />
            Search
          </button>

          {query && (
            <button
              type="button"
              onClick={handleClear}
              disabled={!query.trim() || searching}
              className="btn"
            >
              <CircleX size={14} />
              Clear
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
