"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useTransition } from "react";

import { deleteInterest } from "@/actions/interests";

type Interest = { id: string; query: string };

export function FeedDrawer({
  interests,
  activeInterest,
}: {
  interests: Interest[];
  activeInterest: Interest;
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
    <div className="navbar bg-base-100">
      <div className="navbar-start">
        <div className="drawer">
          <input id="my-drawer-1" type="checkbox" className="drawer-toggle" />
          <div className="drawer-content">
            <label
              htmlFor="my-drawer-1"
              className="btn btn-ghost drawer-button"
            >
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
                    href={`/feed/interest/${interest.id}`} // was: /feed?interest=${interest.id}
                    className="btn btn-ghost"
                    onClick={closeLeftDrawer}
                  >
                    {interest.query}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/feed/new-interest" className="btn">
                  New Interest
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
      <div className="navbar-center">
        <span className="text-xl">{activeInterest.query}</span>
      </div>
      <div className="navbar-end">
        <div className="drawer drawer-end">
          <input id="my-drawer-5" type="checkbox" className="drawer-toggle" />
          <div className="drawer-content ml-auto">
            <label
              htmlFor="my-drawer-5"
              className="drawer-button btn btn-ghost"
            >
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
                <button
                  className="btn"
                  disabled={isPending}
                  onClick={handleDelete}
                >
                  Delete Interest
                </button>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
