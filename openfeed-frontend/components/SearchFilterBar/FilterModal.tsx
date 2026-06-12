import { forwardRef, useImperativeHandle, useRef } from "react";

import Modal from "@/components/Modal";
import {
  ArticleMetadataField,
  MetadataOptionsByField,
} from "@/lib/supabase/queries/global_article_metadata_options";
import { UserInterest } from "@/lib/supabase/queries/user_interests";
import { InterestsManager } from "@/components/InterestsManager";

import Chip from "./Chip";
import SectionLabel from "./SectionLabel";

interface FilterModalProps {
  metadataOptions: MetadataOptionsByField;
  activeMetadataFilters: MetadataOptionsByField;
  interests: UserInterest[];
  userId: string;
  onToggleFieldOption: (field: ArticleMetadataField, name: string) => void;
  onClearField: (field: ArticleMetadataField) => void;
  onInterestsChange: () => void;
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
      interests,
      userId,
      onToggleFieldOption,
      onClearField,
      onInterestsChange,
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

    const topicOptions = metadataOptions.topic;
    const selectedTopics = activeMetadataFilters.topic;

    return (
      <Modal ref={dialogRef} onClose={onClose}>
        <div className="flex flex-col gap-6">
          <span className="heading-modal">Filters</span>

          <div className="flex flex-col gap-2">
            <SectionLabel
              onClear={() => {}}
              showClear={false}
            >
              Your Interests
            </SectionLabel>
            <InterestsManager
              userId={userId}
              initialInterests={interests}
              onInterestsChange={onInterestsChange}
            />
          </div>

          <div>
            <SectionLabel
              onClear={() => onClearField("topic")}
              showClear={selectedTopics.length > 0}
            >
              Topic
            </SectionLabel>
            {topicOptions.length === 0 ? (
              <p className="text-[11px] text-base-content/30 m-0">
                No options available.
              </p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {topicOptions.map((optionName) => (
                  <Chip
                    key={optionName}
                    label={optionName}
                    active={selectedTopics.includes(optionName)}
                    onTap={() => onToggleFieldOption("topic", optionName)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </Modal>
    );
  },
);

FilterModal.displayName = "FilterModal";

export default FilterModal;
