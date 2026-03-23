"use client";

import { useRef } from "react";
import Link from "next/link";

type Interest = { id: string; query: string };

export function FeedDrawer({
  interests,
  activeInterest,
  children,
}: {
  interests: Interest[];
  activeInterest: Interest;
  children: React.ReactNode;
}) {
  const checkboxRef = useRef<HTMLInputElement>(null);

  function closeDrawer() {
    if (checkboxRef.current) {
      checkboxRef.current.checked = false;
    }
  }

  return (
    <div className="drawer">
      <input
        id="interest-drawer"
        ref={checkboxRef}
        type="checkbox"
        className="drawer-toggle"
      />

      {/* ── Main content ── */}
      <div className="drawer-content flex flex-col">
        {/* Navbar */}
        <nav className="navbar bg-base-100 border-b border-base-300">
          <div className="flex-none">
            <label
              htmlFor="interest-drawer"
              className="btn btn-square btn-ghost"
              aria-label="open sidebar"
            >
              {/* Hamburger / sidebar icon */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                className="inline-block h-6 w-6 stroke-current"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </label>
          </div>

          <div className="flex-1 text-center">
            <span className="text-lg font-bold">{activeInterest.query}</span>
          </div>

          <div className="flex-none">
            <button className="btn btn-square btn-ghost" aria-label="info">
              {/* Info icon */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                className="inline-block h-6 w-6 stroke-current"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </button>
          </div>
        </nav>

        {/* Page body */}
        {children}
      </div>

      {/* ── Left sidebar ── */}
      <div className="drawer-side z-1002">
        <label
          htmlFor="interest-drawer"
          aria-label="close sidebar"
          className="drawer-overlay"
        />
        <ul className="menu min-h-full w-80 bg-base-200 p-4 pt-6">
          <li className="menu-title text-sm">Your Interests</li>
          {interests.map((interest) => (
            <li key={interest.id}>
              <Link
                href={`/feed?interest=${interest.id}`}
                className={
                  interest.id === activeInterest.id ? "active font-bold" : ""
                }
                onClick={closeDrawer}
              >
                {interest.query}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
