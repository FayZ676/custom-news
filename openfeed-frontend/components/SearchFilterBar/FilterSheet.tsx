import { forwardRef, useImperativeHandle, useRef } from "react";

import Modal from "@/components/Modal";

import Chip from "./Chip";
import SectionLabel from "./SectionLabel";

interface FilterSheetProps {
  topics: string[];
  activeTopics: string[];
  onToggleTopic: (topic: string) => void;
  keywords: string[];
  onRemoveKeyword: (keyword: string) => void;
  onClearTopics: () => void;
  onClearKeywords: () => void;
}

export interface FilterSheetHandle {
  open: () => void;
}

const FilterSheet = forwardRef<FilterSheetHandle, FilterSheetProps>(
  (
    {
      topics,
      activeTopics,
      onToggleTopic,
      keywords,
      onRemoveKeyword,
      onClearTopics,
      onClearKeywords,
    },
    ref,
  ) => {
    const dialogRef = useRef<HTMLDialogElement>(null);

    useImperativeHandle(ref, () => ({
      open() {
        dialogRef.current?.showModal();
      },
    }));

    return (
      <Modal ref={dialogRef}>
        <div className="w-full max-w-97.5 -mx-6 px-5 pb-8 pt-0 max-h-[80vh] flex flex-col">
          {/* Header */}
          <div className="px-5 pt-4 pb-3">
            <span
              className="text-lg font-bold text-base-content"
              style={{ fontFamily: "Georgia, serif" }}
            >
              Filters
            </span>
          </div>

          <div className="overflow-y-auto flex-1">
            {/* Topics */}
            <SectionLabel
              onClear={onClearTopics}
              showClear={activeTopics.length > 0}
            >
              Topics
            </SectionLabel>
            <div className="flex flex-wrap gap-1.5 mb-7">
              {topics.map((topic) => (
                <Chip
                  key={topic}
                  label={topic}
                  variant="solid"
                  active={activeTopics.includes(topic)}
                  onTap={() => onToggleTopic(topic)}
                />
              ))}
            </div>

            {/* Keywords */}
            <SectionLabel
              onClear={onClearKeywords}
              showClear={keywords.length > 0}
            >
              Keywords
            </SectionLabel>
            {keywords.length === 0 ? (
              <p className="text-[11px] text-base-content/30 m-0">
                Search to add keywords to your filters.
              </p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {keywords.map((kw) => (
                  <button
                    key={kw}
                    onClick={() => onRemoveKeyword(kw)}
                    className="inline-flex items-center gap-1.25 px-2.5 py-1.25 rounded-sm text-[11px] bg-transparent border border-dashed border-base-content/30 text-base-content/60 cursor-pointer"
                  >
                    {kw}
                    <span className="text-[13px] text-base-content/30 leading-none">
                      ×
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </Modal>
    );
  },
);

FilterSheet.displayName = "FilterSheet";

export default FilterSheet;
