import { useEffect, useMemo, useRef, useState } from "react";
import { TextAlignEnd } from "lucide-react";

import {
  ArticleMetadataField,
  MetadataOptionsByField,
} from "@/lib/supabase/queries/global_article_metadata_options";
import { UserInterest } from "@/lib/supabase/queries/user_interests";

import FilterModal from "./FilterModal";
import type { FilterModalHandle } from "./FilterModal";

interface SearchFilterBarProps {
  metadataOptions: MetadataOptionsByField;
  activeMetadataFilters: MetadataOptionsByField;
  interests: UserInterest[];
  userId: string;
  onChangeFieldOptions: (
    field: ArticleMetadataField,
    nextOptions: string[],
  ) => Promise<void>;
  onSearchQueryChange: (query: string) => void;
  onFilterModalClose: () => void;
  onInterestsChange: () => void;
}

export default function SearchFilterBar({
  metadataOptions,
  activeMetadataFilters,
  interests,
  userId,
  onChangeFieldOptions,
  onSearchQueryChange,
  onFilterModalClose,
  onInterestsChange,
}: SearchFilterBarProps) {
  const filterModalRef = useRef<FilterModalHandle>(null);
  const [searchValue, setSearchValue] = useState("");

  const totalTopicFilters = useMemo(
    () => activeMetadataFilters.topic.length,
    [activeMetadataFilters.topic],
  );

  useEffect(() => {
    const timeout = setTimeout(() => {
      onSearchQueryChange(searchValue.trim());
    }, 300);

    return () => clearTimeout(timeout);
  }, [onSearchQueryChange, searchValue]);

  const handleToggleFieldOption = (
    field: ArticleMetadataField,
    name: string,
  ) => {
    const activeValues = activeMetadataFilters[field];
    const nextValues = activeValues.includes(name)
      ? activeValues.filter((value) => value !== name)
      : [...activeValues, name];

    void onChangeFieldOptions(field, nextValues);
  };

  const handleClearField = (field: ArticleMetadataField) => {
    void onChangeFieldOptions(field, []);
  };

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
            <span className="hidden sm:inline">Filters</span>
            <TextAlignEnd size={16} />
          </button>
          {totalTopicFilters > 0 && (
            <span className="absolute -top-1 -right-1 bg-error text-error-content rounded-full w-3.75 h-3.75 text-[8px] flex items-center justify-center font-semibold pointer-events-none">
              {totalTopicFilters}
            </span>
          )}
        </div>
      </div>

      <FilterModal
        ref={filterModalRef}
        metadataOptions={metadataOptions}
        activeMetadataFilters={activeMetadataFilters}
        interests={interests}
        userId={userId}
        onToggleFieldOption={handleToggleFieldOption}
        onClearField={handleClearField}
        onInterestsChange={onInterestsChange}
        onClose={onFilterModalClose}
      />
    </div>
  );
}
