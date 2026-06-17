"use client";

import { forwardRef, useImperativeHandle, useRef } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";

import Modal from "@/components/Modal";
import { UserInterest } from "@/lib/supabase/queries/user_interests";
import { buildQueryFromClauses } from "@/lib/interests/refine";

interface FilterModalProps {
  interests: UserInterest[];
}

export interface FilterModalHandle {
  open: () => void;
  close: () => void;
}

function querySummary(interest: UserInterest): string {
  const all = interest.query_payload?.all ?? [];
  const any = interest.query_payload?.any ?? [];
  return buildQueryFromClauses(all, any) ?? interest.interest_text;
}

const FilterModal = forwardRef<FilterModalHandle, FilterModalProps>(
  ({ interests }, ref) => {
    const router = useRouter();
    const dialogRef = useRef<HTMLDialogElement>(null);

    useImperativeHandle(ref, () => ({
      open() { dialogRef.current?.showModal(); },
      close() { dialogRef.current?.close(); },
    }));

    const navigate = (href: string) => {
      dialogRef.current?.close();
      router.push(href);
    };

    return (
      <Modal ref={dialogRef}>
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="heading-modal">Your Queries</span>
            <button
              onClick={() => navigate("/feed/query-builder")}
              className="btn-soft"
            >
              <Plus size={14} />
              New query
            </button>
          </div>

          {interests.length === 0 ? (
            <p className="text-subtle italic">
              No queries yet. Create one to start getting personalised articles.
            </p>
          ) : (
            <ul className="flex flex-col">
              {interests.map((interest) => (
                <li
                  key={interest.id}
                  onClick={() => navigate(`/feed/query-builder?id=${interest.id}`)}
                  className="py-3 border-b border-base-300 cursor-pointer"
                >
                  <p className="heading-article line-clamp-1 hover:underline">
                    {interest.interest_text}
                  </p>
                  <p className="text-muted truncate mt-1">
                    {querySummary(interest)}
                  </p>
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
