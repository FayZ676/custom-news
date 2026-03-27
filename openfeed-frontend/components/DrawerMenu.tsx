"use client";

import Link from "next/link";
import { useRef } from "react";
import { Search } from "lucide-react";

import { Interest } from "@/lib/backend";

export interface DrawerMenuInterest {
  interest: Interest;
  hasUnreadArticles: boolean;
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
            <li key={interest.interest.id} className="">
              <Link
                href={`/feed/interest/${interest.interest.id}`}
                className="flex justify-between btn btn-ghost"
                onClick={closeDrawer}
              >
                <span>{interest.interest.query}</span>
                {interest.hasUnreadArticles && (
                  <span className="w-2 h-2 rounded-full bg-success"></span>
                )}
              </Link>
            </li>
          ))}
          <li>
            <Link href="/feed" className="btn">
              <Search size={14} />
              <span>Search</span>
            </Link>
          </li>
        </ul>
      </div>
    </div>
  );
}
