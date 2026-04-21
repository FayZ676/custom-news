"use client";

import { useRef } from "react";
import { CircleX } from "lucide-react";
import Modal from "./Modal";

export default function SearchbarTooltip() {
  const modalRef = useRef<HTMLDialogElement>(null);

  return (
    <>
      <button
        className="ml-auto text-sm text-neutral-500 italic underline cursor-pointer"
        onClick={() => modalRef.current?.showModal()}
      >
        Need help?
      </button>

      <Modal ref={modalRef}>
        <h3 className="font-bold text-lg pr-6">How Search Works</h3>
        <div className="py-4 flex flex-col gap-3 text-sm text-base-content/80">
          <p>
            <span className="font-bold">Search</span> — Type something you're
            interested in into the searchbar.{" "}
            <span className="font-bold">Be specific.</span>
          </p>
          <p>
            <span className="font-bold">Save</span> — After typing a query,
            click the <span className="font-bold underline">Save</span> button
            to add it to your News Feed. New articles related to your interest
            will automatically appear in your news feed.
          </p>
          <p>
            <span className="font-bold">Clear</span> — Click the{" "}
            <CircleX size={14} strokeWidth={3} className="inline opacity-50" />{" "}
            icon to clear the searchbar and any search results.
          </p>
        </div>
      </Modal>
    </>
  );
}
