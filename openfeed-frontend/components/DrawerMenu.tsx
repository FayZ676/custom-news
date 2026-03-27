"use client";

import Link from "next/link";
import { useRef } from "react";

type Interest = { id: string; query: string };

export function DrawerMenu({ interests }: { interests: Interest[] }) {
  const checkboxRef = useRef<HTMLInputElement>(null);

  function closeDrawer() {
    if (checkboxRef.current) {
      checkboxRef.current.checked = false;
    }
  }

  return (
    <div className="drawer">
      <input
        id="my-drawer-1"
        ref={checkboxRef}
        type="checkbox"
        className="drawer-toggle"
      />
      <div className="drawer-content">
        <label htmlFor="my-drawer-1" className="btn btn-ghost drawer-button">
          Menu
        </label>
      </div>
      <div className="drawer-side">
        <label
          htmlFor="my-drawer-1"
          aria-label="close sidebar"
          className="drawer-overlay"
        ></label>
        <ul className="menu bg-base-200 min-h-full w-80 p-4">
          {interests.map((interest) => (
            <li key={interest.id}>
              <Link
                href={`/feed/interest/${interest.id}`}
                className="btn btn-ghost"
                onClick={closeDrawer}
              >
                {interest.query}
              </Link>
            </li>
          ))}
          <li>
            <Link href="/feed" className="btn">
              Search
            </Link>
          </li>
        </ul>
      </div>
    </div>
  );
}
