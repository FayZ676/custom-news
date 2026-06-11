import { forwardRef, useImperativeHandle, useRef } from "react";

import Modal from "@/components/Modal";
import {
  ArticleMetadataField,
  MetadataOptionsByField,
} from "@/lib/supabase/queries/global_article_metadata_options";

import Chip from "./Chip";
import SectionLabel from "./SectionLabel";

interface FilterModalProps {
  metadataOptions: MetadataOptionsByField;
  activeMetadataFilters: MetadataOptionsByField;
  onToggleFieldOption: (field: ArticleMetadataField, name: string) => void;
  onClearField: (field: ArticleMetadataField) => void;
  onClose: () => void;
}

export interface FilterModalHandle {
  open: () => void;
}

const FilterModal = forwardRef<FilterModalHandle, FilterModalProps>(
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
        <div className="flex flex-col gap-4">
          <span className="heading-modal">Filters</span>

          <div className="flex flex-col gap-7">
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
                <div key={field}>
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

FilterModal.displayName = "FilterModal";

export default FilterModal;
