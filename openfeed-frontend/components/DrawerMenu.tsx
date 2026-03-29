"use client";

import Link from "next/link";
import { useRef } from "react";
import { Search, Menu } from "lucide-react";

import { Interest } from "@/lib/backend";

export interface DrawerMenuInterest {
  interest: Interest;
  unreadArticlesCount: number;
}

export function DrawerMenu({ interests }: { interests: DrawerMenuInterest[] }) {
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
          <Menu />
        </label>
      </div>
      <div className="drawer-side">
        <label
          htmlFor="my-drawer-1"
          aria-label="close sidebar"
          className="drawer-overlay"
        ></label>
        <ul className="menu bg-base-200 min-h-full w-80 p-4 gap-1">
          <li>
            <Link href="/feed" className="btn">
              <Search size={14} />
              <span>Search</span>
            </Link>
          </li>
          {interests.map((interest) => (
            <li key={interest.interest.id} className="">
              <Link
                href={`/feed/interest/${interest.interest.id}`}
                className="grid-cols-[minmax(0,1fr)_auto]"
                onClick={closeDrawer}
              >
                <span className="truncate">{interest.interest.query}</span>
                {interest.unreadArticlesCount > 0 && (
                  <span className="badge badge-outline badge-success badge-sm border">
                    {interest.unreadArticlesCount}
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
