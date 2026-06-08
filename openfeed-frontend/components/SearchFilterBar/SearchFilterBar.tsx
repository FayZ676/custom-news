import { useMemo, useRef } from "react";

import {
  ArticleMetadataField,
  MetadataOptionsByField,
} from "@/lib/supabase/queries/global_article_metadata_options";

import FilterSheet from "./FilterSheet";
import type { FilterSheetHandle } from "./FilterSheet";

interface SearchFilterBarProps {
  metadataOptions: MetadataOptionsByField;
  activeMetadataFilters: MetadataOptionsByField;
  onChangeFieldOptions: (
    field: ArticleMetadataField,
    nextOptions: string[],
  ) => Promise<void>;
  onFilterSheetClose: () => void;
}

export default function SearchFilterBar({
  metadataOptions,
  activeMetadataFilters,
  onChangeFieldOptions,
  onFilterSheetClose,
}: SearchFilterBarProps) {
  const filterSheetRef = useRef<FilterSheetHandle>(null);

  const totalFilters = useMemo(
    () =>
      Object.values(activeMetadataFilters).reduce(
        (total, values) => total + values.length,
        0,
      ),
    [activeMetadataFilters],
  );

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
    <div className="sticky top-0 z-30 bg-base-100 border-b border-base-300 px-5 py-2.5">
      <div className="flex items-center justify-between gap-2.5">
        <div className="text-[11px] uppercase tracking-[0.12em] text-base-content/50">
          Personalize your feed with metadata filters
        </div>

        <div className="relative shrink-0">
          <button
            onClick={() => filterSheetRef.current?.open()}
            className="inline-flex items-center gap-2 rounded-sm bg-base-200 border-none cursor-pointer px-3 h-9.5"
          >
            <span className="text-[11px] uppercase tracking-[0.08em] text-base-content/80">
              Filters
            </span>
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

      <FilterSheet
        ref={filterSheetRef}
        metadataOptions={metadataOptions}
        activeMetadataFilters={activeMetadataFilters}
        onToggleFieldOption={handleToggleFieldOption}
        onClearField={handleClearField}
        onClose={onFilterSheetClose}
      />
    </div>
  );
}
