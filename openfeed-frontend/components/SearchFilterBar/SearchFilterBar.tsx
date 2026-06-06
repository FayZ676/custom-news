import { useState, useRef, useEffect } from "react";

import FilterSheet from "./FilterSheet";
import type { FilterSheetHandle } from "./FilterSheet";

interface SearchFilterBarProps {
  topics?: string[];
  activeTopics?: string[];
  keywords?: string[];
  onChangeTopics: (topics: string[]) => void;
  onChangeKeywords: (keywords: string[]) => void;
  onSearchStories: (query: string) => Promise<void>;
  onFilterSheetClose: () => void;
}

function fuzzyMatch(query: string, str: string): boolean {
  const q = query.toLowerCase();
  const s = str.toLowerCase();
  return s.includes(q) || q.split("").every((c) => s.includes(c));
}

export default function SearchFilterBar({
  topics = [],
  activeTopics = [],
  keywords = [],
  onChangeTopics,
  onChangeKeywords,
  onSearchStories,
  onFilterSheetClose,
}: SearchFilterBarProps) {
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [isSubmittingSearch, setIsSubmittingSearch] = useState(false);
  const [chipTrayVisible, setChipTrayVisible] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const filterSheetRef = useRef<FilterSheetHandle>(null);

  const totalFilters = activeTopics.length + keywords.length;
  const matchedTopics =
    query.length > 0 ? topics.filter((t) => fuzzyMatch(query, t)) : [];
  const showTray = searching && query.length > 0;

  useEffect(() => {
    if (showTray) {
      setTimeout(() => setChipTrayVisible(true), 10);
    } else {
      setChipTrayVisible(false);
    }
  }, [showTray]);

  const handleSearchBlur = () => {
    setTimeout(() => {
      setSearching(false);
      setQuery("");
    }, 200);
  };

  const handleTopicChipTap = (topic: string) => {
    if (!activeTopics.includes(topic)) {
      onChangeTopics([...activeTopics, topic]);
    }
    setQuery("");
    setSearching(false);
    inputRef.current?.blur();
  };

  const handleKeywordChipTap = () => {
    const trimmed = query.trim();
    if (trimmed && !keywords.includes(trimmed)) {
      onChangeKeywords([...keywords, trimmed]);
    }
    setQuery("");
    setSearching(false);
    inputRef.current?.blur();
  };

  const handleToggleTopic = (topic: string) => {
    onChangeTopics(
      activeTopics.includes(topic)
        ? activeTopics.filter((t) => t !== topic)
        : [...activeTopics, topic],
    );
  };

  const handleSubmitSearch = async () => {
    const trimmedQuery = query.trim();
    if (!trimmedQuery || !onSearchStories) return;

    setIsSubmittingSearch(true);
    try {
      await onSearchStories(trimmedQuery);
    } finally {
      setIsSubmittingSearch(false);
    }
  };

  return (
    <div className="sticky top-0 z-30 bg-base-100 border-b border-base-300 px-5 py-2.5">
      {/* Search + Filter row */}
      <div className="flex items-center gap-2.5">
        {/* Search input */}
        <div
          className={`flex-1 flex items-center gap-2 bg-base-200 rounded-sm px-3 py-2 border transition-[border] duration-150 ease ${searching ? "border-base-content" : "border-transparent"}`}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <circle cx="6" cy="6" r="4.5" stroke="#888" strokeWidth="1.3" />
            <path
              d="M9.5 9.5L12 12"
              stroke="#888"
              strokeWidth="1.3"
              strokeLinecap="round"
            />
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setSearching(true)}
            onBlur={handleSearchBlur}
            onKeyDown={(e) => {
              if (e.key !== "Enter") return;
              e.preventDefault();
              void handleSubmitSearch();
            }}
            placeholder="Search stories..."
            className="flex-1 border-none bg-transparent outline-none text-[12px] text-base-content tracking-[0.02em]"
          />
          {isSubmittingSearch && (
            <span className="text-[10px] text-base-content/60 uppercase tracking-wide">
              Searching
            </span>
          )}
          {query.length > 0 && (
            <button
              onMouseDown={(e) => {
                e.preventDefault();
                setQuery("");
              }}
              className="bg-transparent border-none cursor-pointer p-0 text-base-content/40 text-base leading-none"
            >
              ×
            </button>
          )}
        </div>

        {/* Filter button */}
        <div className="relative shrink-0">
          <button
            onClick={() => filterSheetRef.current?.open()}
            className="flex items-center justify-center w-9.5 h-9.5 rounded-sm bg-base-200 border-none cursor-pointer"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M2 4h12M5 8h6M7 12h2"
                stroke="#888"
                strokeWidth="1.4"
                strokeLinecap="round"
              />
            </svg>
          </button>
          {totalFilters > 0 && (
            <span className="absolute -top-1 -right-1 bg-error text-error-content rounded-full w-3.75 h-3.75 text-[8px] flex items-center justify-center font-semibold pointer-events-none">
              {totalFilters}
            </span>
          )}
        </div>
      </div>

      {/* Chip tray */}
      <div
        className={`overflow-hidden transition-[max-height,opacity] duration-[250ms,200ms] ease ${showTray ? "max-h-20" : "max-h-0"} ${chipTrayVisible ? "opacity-100" : "opacity-0"}`}
      >
        <div className="pt-2.5">
          <div className="text-[9px] tracking-[0.12em] uppercase text-base-content/40 mb-1.75">
            Add to filters
          </div>
          <div className="flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none]">
            {query.trim().length > 0 && (
              <button
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleKeywordChipTap();
                }}
                className="inline-flex items-center gap-1 px-2.75 py-1.25 rounded-sm text-[11px] bg-transparent border border-base-content text-base-content cursor-pointer whitespace-nowrap shrink-0"
              >
                <span className="text-xs">+</span>"{query.trim()}"
              </button>
            )}
            {matchedTopics.map((topic) => (
              <button
                key={topic}
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleTopicChipTap(topic);
                }}
                className={`inline-flex items-center px-2.75 py-1.25 rounded-sm text-[11px] border border-transparent cursor-pointer whitespace-nowrap shrink-0 ${activeTopics.includes(topic) ? "bg-base-content text-base-100" : "bg-base-200 text-base-content"}`}
              >
                {topic}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Filter sheet */}
      <FilterSheet
        ref={filterSheetRef}
        topics={topics}
        activeTopics={activeTopics}
        onToggleTopic={handleToggleTopic}
        keywords={keywords}
        onClose={onFilterSheetClose}
        onRemoveKeyword={(kw: string) =>
          onChangeKeywords(keywords.filter((k) => k !== kw))
        }
        onClearTopics={() => onChangeTopics([])}
        onClearKeywords={() => onChangeKeywords([])}
      />
    </div>
  );
}
