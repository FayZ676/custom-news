// components/FeedDrawer.tsx
"use client";

import { useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { deleteInterest } from "@/actions/interests";

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
  const leftCheckboxRef = useRef<HTMLInputElement>(null);
  const rightCheckboxRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function closeLeftDrawer() {
    if (leftCheckboxRef.current) {
      leftCheckboxRef.current.checked = false;
    }
  }

  function closeRightDrawer() {
    if (rightCheckboxRef.current) {
      rightCheckboxRef.current.checked = false;
    }
  }

  function handleDelete() {
    startTransition(async () => {
      await deleteInterest(activeInterest.id);
      closeRightDrawer();
      router.push("/feed");
    });
  }

  return (
    <div className="drawer">
      <input
        id="left-drawer"
        ref={leftCheckboxRef}
        type="checkbox"
        className="drawer-toggle"
      />

      {/* ── Main content (contains the right drawer) ── */}
      <div className="drawer-content">
        <div className="drawer drawer-end">
          <input
            id="right-drawer"
            ref={rightCheckboxRef}
            type="checkbox"
            className="drawer-toggle"
          />

          <div className="drawer-content flex flex-col">
            {/* Navbar */}
            <nav className="navbar bg-base-100 border-b border-base-300">
              <div className="flex-none">
                <label
                  htmlFor="left-drawer"
                  className="btn btn-square btn-ghost"
                  aria-label="open sidebar"
                >
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
                <span className="text-lg font-bold">
                  {activeInterest.query}
                </span>
              </div>

              <div className="flex-none">
                <label
                  htmlFor="right-drawer"
                  className="btn btn-square btn-ghost"
                  aria-label="open info"
                >
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
                </label>
              </div>
            </nav>

            {/* Page body */}
            {children}
          </div>

          {/* ── Right sidebar ── */}
          <div className="drawer-side z-[1002]">
            <label
              htmlFor="right-drawer"
              aria-label="close info sidebar"
              className="drawer-overlay"
            />
            <div className="flex min-h-full w-80 flex-col gap-4 bg-base-200 p-4 pt-6">
              <h2 className="text-lg font-bold">{activeInterest.query}</h2>

              <div className="mt-auto">
                <button
                  className="btn btn-error btn-block"
                  disabled={isPending}
                  onClick={handleDelete}
                >
                  {isPending ? (
                    <span className="loading loading-spinner loading-sm" />
                  ) : (
                    "Delete Interest"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Left sidebar ── */}
      <div className="drawer-side z-[1002]">
        <label
          htmlFor="left-drawer"
          aria-label="close sidebar"
          className="drawer-overlay"
        />
        <div className="flex min-h-full w-80 flex-col bg-base-200 p-4 pt-6">
          <ul className="menu">
            <li className="menu-title text-sm">Your Interests</li>
            {interests.map((interest) => (
              <li key={interest.id}>
                <Link
                  href={`/feed?interest=${interest.id}`}
                  className={
                    interest.id === activeInterest.id ? "active font-bold" : ""
                  }
                  onClick={closeLeftDrawer}
                >
                  {interest.query}
                </Link>
              </li>
            ))}
          </ul>

          <Link
            href="/feed/new-interest"
            className="btn btn-primary btn-block mt-4"
          >
            + New Interest
          </Link>
        </div>
      </div>
    </div>
  );
}
