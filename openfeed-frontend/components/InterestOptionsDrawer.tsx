"use client";

import { useRouter } from "next/navigation";
import { useRef, useTransition } from "react";

import { deleteInterest } from "@/actions/interests";

export function InterestOptionsDrawer({ interestId }: { interestId: string }) {
  const checkboxRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function closeDrawer() {
    if (checkboxRef.current) {
      checkboxRef.current.checked = false;
    }
  }

  function handleDelete() {
    startTransition(async () => {
      await deleteInterest(interestId);
      closeDrawer();
      router.push("/feed");
    });
  }

  return (
    <div className="drawer drawer-end">
      <input
        id="my-drawer-5"
        ref={checkboxRef}
        type="checkbox"
        className="drawer-toggle"
      />
      <div className="drawer-content ml-auto">
        <label htmlFor="my-drawer-5" className="drawer-button btn btn-ghost">
          Options
        </label>
      </div>
      <div className="drawer-side">
        <label
          htmlFor="my-drawer-5"
          aria-label="close sidebar"
          className="drawer-overlay"
        ></label>
        <ul className="menu bg-base-200 min-h-full w-80 p-4">
          <li>
            <button className="btn" disabled={isPending} onClick={handleDelete}>
              Delete Interest
            </button>
          </li>
        </ul>
      </div>
    </div>
  );
}
