import { forwardRef, useImperativeHandle, useRef } from "react";

import Modal from "@/components/Modal";
import {
  ArticleMetadataField,
  MetadataOptionsByField,
} from "@/lib/supabase/queries/global_article_metadata_options";

import Chip from "./Chip";
import SectionLabel from "./SectionLabel";

interface FilterSheetProps {
  metadataOptions: MetadataOptionsByField;
  activeMetadataFilters: MetadataOptionsByField;
  onToggleFieldOption: (field: ArticleMetadataField, name: string) => void;
  onClearField: (field: ArticleMetadataField) => void;
  onClose: () => void;
}

export interface FilterSheetHandle {
  open: () => void;
}

const FilterSheet = forwardRef<FilterSheetHandle, FilterSheetProps>(
  (
    {
      metadataOptions,
      activeMetadataFilters,
      onToggleFieldOption,
      onClearField,
      onClose,
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
      <Modal ref={dialogRef} onClose={onClose}>
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
            {(
              [
                "topic",
                "type",
                "coverage",
                "duration",
                "impact",
              ] as ArticleMetadataField[]
            ).map((field) => {
              const options = metadataOptions[field];
              const selected = activeMetadataFilters[field];
              const label = field[0].toUpperCase() + field.slice(1);

              return (
                <div key={field} className="mb-7">
                  <SectionLabel
                    onClear={() => onClearField(field)}
                    showClear={selected.length > 0}
                  >
                    {label}
                  </SectionLabel>
                  {options.length === 0 ? (
                    <p className="text-[11px] text-base-content/30 m-0">
                      No options available.
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {options.map((optionName) => (
                        <Chip
                          key={optionName}
                          label={optionName}
                          variant="solid"
                          active={selected.includes(optionName)}
                          onTap={() => onToggleFieldOption(field, optionName)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </Modal>
    );
  },
);

FilterSheet.displayName = "FilterSheet";

export default FilterSheet;
