import { useEffect, useRef, useState } from "react";
import { TextAlignEnd } from "lucide-react";

import { UserInterest } from "@/lib/supabase/queries/user_interests";

import FilterModal from "./FilterModal";
import type { FilterModalHandle } from "./FilterModal";

interface SearchFilterBarProps {
  interests: UserInterest[];
  onSearchQueryChange: (query: string) => void;
}

export default function SearchFilterBar({
  interests,
  onSearchQueryChange,
}: SearchFilterBarProps) {
  const filterModalRef = useRef<FilterModalHandle>(null);
  const [searchValue, setSearchValue] = useState("");

  useEffect(() => {
    const timeout = setTimeout(() => {
      onSearchQueryChange(searchValue.trim());
    }, 300);

    return () => clearTimeout(timeout);
  }, [onSearchQueryChange, searchValue]);

  return (
    <div className="sticky top-0 z-30 bg-base-100 py-4 border-b border-base-300">
      <div className="flex items-center justify-between gap-3">
        <div className="flex-1">
          <input
            type="search"
            value={searchValue}
            onChange={(event) => setSearchValue(event.target.value)}
            placeholder="Search articles"
            className="input-field"
            aria-label="Search articles"
          />
        </div>

        <div className="relative shrink-0">
          <button
            onClick={() => filterModalRef.current?.open()}
            className="btn-soft h-9.5"
          >
            <span className="hidden sm:inline">Queries</span>
            <TextAlignEnd size={16} />
          </button>
        </div>
      </div>

      <FilterModal
        ref={filterModalRef}
        interests={interests}
      />
    </div>
  );
}
