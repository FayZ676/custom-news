import { useEffect, useRef, useState } from "react";
import { TextAlignEnd } from "lucide-react";

import { UserInterest } from "@/lib/supabase/queries/user_interests";

import FilterModal from "./FilterModal";
import type { FilterModalHandle } from "./FilterModal";

interface SearchFilterBarProps {
  interests: UserInterest[];
  userId: string;
  onSearchQueryChange: (query: string) => void;
  onInterestAdded: (interestText: string) => void | Promise<void>;
  onInterestRemoved: () => void | Promise<void>;
}

export default function SearchFilterBar({
  interests,
  userId,
  onSearchQueryChange,
  onInterestAdded,
  onInterestRemoved,
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
    <div className="sticky top-0 z-30 bg-base-100 py-4">
      <div className="flex items-center justify-between gap-2.5">
        <div className="flex-1">
          <input
            type="search"
            value={searchValue}
            onChange={(event) => setSearchValue(event.target.value)}
            placeholder="Search articles"
            className="w-full rounded-sm bg-base-200 border border-base-300 px-3 h-9.5 text-sm text-base-content placeholder:text-base-content/45 focus:outline-none focus:ring-1 focus:ring-base-content/35"
            aria-label="Search articles"
          />
        </div>

        <div className="relative shrink-0">
          <button
            onClick={() => filterModalRef.current?.open()}
            className="btn-soft h-9.5"
          >
            <span className="hidden sm:inline">Interests</span>
            <TextAlignEnd size={16} />
          </button>
        </div>
      </div>

      <FilterModal
        ref={filterModalRef}
        interests={interests}
        userId={userId}
        onInterestAdded={onInterestAdded}
        onInterestRemoved={onInterestRemoved}
      />
    </div>
  );
}
