"use client";

import { forwardRef, useImperativeHandle, useRef } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";

import Modal from "@/components/Modal";
import { UserInterest } from "@/lib/supabase/queries/user_interests";

interface FilterModalProps {
  interests: UserInterest[];
}

export interface FilterModalHandle {
  open: () => void;
  close: () => void;
}

const FilterModal = forwardRef<FilterModalHandle, FilterModalProps>(
  ({ interests }, ref) => {
    const dialogRef = useRef<HTMLDialogElement>(null);

    useImperativeHandle(ref, () => ({
      open() {
        dialogRef.current?.showModal();
      },
      close() {
        dialogRef.current?.close();
      },
    }));

    const closeDialog = () => dialogRef.current?.close();

    return (
      <Modal ref={dialogRef}>
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="heading-modal">Your Queries</span>
            <Link
              href="/feed/query-builder"
              prefetch
              onClick={closeDialog}
              className="btn-soft"
            >
              <Plus size={14} />
              New query
            </Link>
          </div>

          {interests.length === 0 ? (
            <p className="text-subtle italic">
              No queries yet. Create one to start getting personalised articles.
            </p>
          ) : (
            <ul className="flex flex-col">
              {interests.map((interest) => (
                <li key={interest.id}>
                  <Link
                    href={`/feed/query-builder?id=${interest.id}`}
                    prefetch
                    onClick={closeDialog}
                    className="block py-3 border-b border-base-300 cursor-pointer"
                  >
                    <p className="text-body line-clamp-2 hover:underline">
                      {interest.interest_text}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Modal>
    );
  },
);

FilterModal.displayName = "FilterModal";

export default FilterModal;
