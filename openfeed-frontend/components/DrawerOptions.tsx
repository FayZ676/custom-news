"use client";

import { useRef } from "react";

export function InterestOptionsDrawer({
  onDelete,
  isPending,
}: {
  onDelete: () => void;
  isPending: boolean;
}) {
  const checkboxRef = useRef<HTMLInputElement>(null);

  function closeDrawer() {
    if (checkboxRef.current) checkboxRef.current.checked = false;
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
        />
        <ul className="menu bg-base-200 min-h-full w-80 p-4">
          <li>
            <button
              className="btn"
              disabled={isPending}
              onClick={() => {
                closeDrawer();
                onDelete();
              }}
            >
              Delete Interest
            </button>
          </li>
        </ul>
      </div>
    </div>
  );
}
