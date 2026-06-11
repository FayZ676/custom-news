import { useEffect, useMemo, useRef, useState } from "react";

import {
  ArticleMetadataField,
  MetadataOptionsByField,
} from "@/lib/supabase/queries/global_article_metadata_options";

import FilterModal from "./FilterModal";
import type { FilterModalHandle } from "./FilterModal";

interface SearchFilterBarProps {
  metadataOptions: MetadataOptionsByField;
  activeMetadataFilters: MetadataOptionsByField;
  onChangeFieldOptions: (
    field: ArticleMetadataField,
    nextOptions: string[],
  ) => Promise<void>;
  onSearchQueryChange: (query: string) => void;
  onFilterModalClose: () => void;
}

export default function SearchFilterBar({
  metadataOptions,
  activeMetadataFilters,
  onChangeFieldOptions,
  onSearchQueryChange,
  onFilterModalClose,
}: SearchFilterBarProps) {
  const filterModalRef = useRef<FilterModalHandle>(null);
  const [searchValue, setSearchValue] = useState("");

  const totalFilters = useMemo(
    () =>
      Object.values(activeMetadataFilters).reduce(
        (total, values) => total + values.length,
        0,
      ),
    [activeMetadataFilters],
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
    <div className="sticky top-0 z-30 bg-base-100 border-b border-base-300 py-4">
      <div className="flex items-center justify-between gap-2.5">
        <div className="flex-1">
          <input
            type="search"
            value={searchValue}
            onChange={(event) => setSearchValue(event.target.value)}
            placeholder="Search article titles"
            className="w-full rounded-sm bg-base-200 border border-base-300 px-3 h-9.5 text-sm text-base-content placeholder:text-base-content/45 focus:outline-none focus:ring-1 focus:ring-base-content/35"
            aria-label="Search article titles"
          />
        </div>

        <div className="relative shrink-0">
          <button
            onClick={() => filterModalRef.current?.open()}
            className="btn-secondary"
          >
            <span className="uppercase tracking-[0.08em]">Filters</span>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M2 4h12M5 8h6M7 12h2"
                stroke="currentColor"
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

      <FilterModal
        ref={filterModalRef}
        metadataOptions={metadataOptions}
        activeMetadataFilters={activeMetadataFilters}
        onToggleFieldOption={handleToggleFieldOption}
        onClearField={handleClearField}
        onClose={onFilterModalClose}
      />
    </div>
  );
}
