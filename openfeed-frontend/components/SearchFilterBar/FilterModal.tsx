import { forwardRef, useImperativeHandle, useRef } from "react";

import Modal from "@/components/Modal";
import { UserInterest } from "@/lib/supabase/queries/user_interests";
import { InterestsManager } from "@/components/InterestsManager";
import { SourcesManager } from "@/components/SourcesManager";

interface FilterModalProps {
  interests: UserInterest[];
  userId: string;
  subscribedSourceKeys: string[];
  onInterestAdded: (interest: UserInterest) => void | Promise<void>;
  onInterestRemoved: () => void | Promise<void>;
  onSourcesChanged: () => void | Promise<void>;
}

export interface FilterModalHandle {
  open: () => void;
}

const FilterModal = forwardRef<FilterModalHandle, FilterModalProps>(
  (
    {
      interests,
      userId,
      subscribedSourceKeys,
      onInterestAdded,
      onInterestRemoved,
      onSourcesChanged,
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
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-4">
            <span className="heading-modal">Your Interests</span>
            <InterestsManager
              userId={userId}
              initialInterests={interests}
              onInterestAdded={onInterestAdded}
              onInterestRemoved={onInterestRemoved}
            />
          </div>

          <div className="flex flex-col gap-4">
            <span className="heading-modal">Sources</span>
            <SourcesManager
              userId={userId}
              initialSubscribedKeys={subscribedSourceKeys}
              onSourceSubscribed={onSourcesChanged}
              onSourceUnsubscribed={onSourcesChanged}
            />
          </div>
        </div>
      </Modal>
    );
  },
);

FilterModal.displayName = "FilterModal";

export default FilterModal;
