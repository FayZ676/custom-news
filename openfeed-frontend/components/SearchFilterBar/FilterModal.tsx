import { forwardRef, useImperativeHandle, useRef } from "react";

import Modal from "@/components/Modal";
import { UserInterest } from "@/lib/supabase/queries/user_interests";
import { InterestsManager } from "@/components/InterestsManager";

interface FilterModalProps {
  interests: UserInterest[];
  userId: string;
  onInterestsChange: () => void;
}

export interface FilterModalHandle {
  open: () => void;
}

const FilterModal = forwardRef<FilterModalHandle, FilterModalProps>(
  ({ interests, userId, onInterestsChange }, ref) => {
    const dialogRef = useRef<HTMLDialogElement>(null);

    useImperativeHandle(ref, () => ({
      open() {
        dialogRef.current?.showModal();
      },
    }));

    return (
      <Modal ref={dialogRef}>
        <div className="flex flex-col gap-6">
          <span className="heading-modal">Your Interests</span>
          <InterestsManager
            userId={userId}
            initialInterests={interests}
            onInterestsChange={onInterestsChange}
          />
        </div>
      </Modal>
    );
  },
);

FilterModal.displayName = "FilterModal";

export default FilterModal;
