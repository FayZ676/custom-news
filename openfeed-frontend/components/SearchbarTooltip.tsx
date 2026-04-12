"use client";

import { useRef } from "react";
import { CircleX } from "lucide-react";

export default function SearchbarTooltip() {
  const modalRef = useRef<HTMLDialogElement>(null);

  return (
    <>
      <button
        className="ml-auto text-xs text-neutral-500 italic underline cursor-pointer"
        onClick={() => modalRef.current?.showModal()}
      >
        Need help?
      </button>

      <dialog
        ref={modalRef}
        className="modal modal-bottom sm:modal-middle rounded-none"
      >
        <div className="modal-box rounded-none">
          <form method="dialog">
            <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">
              ✕
            </button>
          </form>

          <h3 className="font-bold text-lg pr-6">How Search Works</h3>
          <div className="py-4 flex flex-col gap-3 text-sm text-base-content/80">
            <p>
              <span className="font-bold">Search</span> — Type something you're
              interested in into the searchbar.{" "}
              <span className="font-bold">Be specific.</span> Press the{" "}
              <kbd className="kbd kbd-sm">Enter</kbd> key on your keyboard to
              see related articles.
            </p>
            <p>
              <span className="font-bold">Save</span> — After typing a query,
              click the <span className="font-bold underline">Save</span> button
              to add it as a persistent interest. New articles related to your
              query will automatically appear in your feed periodically.
            </p>
            <p>
              <span className="font-bold">Clear</span> — Click the{" "}
              <CircleX
                size={14}
                strokeWidth={3}
                className="inline opacity-50"
              />{" "}
              icon to clear the searchbar and any search results.
            </p>
          </div>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button>close</button>
        </form>
      </dialog>
    </>
  );
}
