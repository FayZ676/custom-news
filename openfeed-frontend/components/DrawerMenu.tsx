"use client";

import Link from "next/link";
import { useRef } from "react";

import { Search, LogOut, Menu, UserRound } from "lucide-react";

import { Interest } from "@/lib/backend";
import { Database } from "@/lib/supabase/supabase.types";

export interface DrawerMenuInterest {
  interest: Interest;
  unreadArticlesCount: number;
}

export interface DrawerMenuProps {
  userEmail: string | undefined;
  handleSignOut: () => void;
  interests: DrawerMenuInterest[];
  settings: Database["public"]["Tables"]["user_settings"]["Row"];
  handleUpdateNotifications: () => Promise<void>;
}

export function DrawerMenu(props: DrawerMenuProps) {
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
        <div className="flex flex-col gap-8 bg-base-100 min-h-full w-80 p-4">
          <Link href="/feed" className="btn btn-block">
            <Search size={14} />
            <span>Browse Articles</span>
          </Link>
          <div className="collapse collapse-arrow rounded-none">
            <input type="checkbox" defaultChecked />
            <span className="collapse-title text-xl font-bold p-0">
              Interests
            </span>
            <ul className="collapse-content p-0">
              {props.interests.map((interest) => (
                <li key={interest.interest.id}>
                  <Link
                    href={`/feed/interest/${interest.interest.id}`}
                    className="flex justify-between items-center gap-2 border-b border-base-300 py-3"
                    onClick={closeDrawer}
                  >
                    <span className="font-semibold truncate min-w-0">
                      {interest.interest.query}
                    </span>
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
          <div className="collapse collapse-arrow rounded-none">
            <input type="checkbox" />
            <span className="collapse-title text-xl font-bold p-0">
              Settings
            </span>
            <ul className="collapse-content p-0">
              <li>
                <div className="flex justify-between items-center gap-2 border-b border-base-300 py-3">
                  <span className="font-semibold truncate min-w-0">
                    Email Notifications
                  </span>
                  <input
                    type="checkbox"
                    defaultChecked={props.settings.email_notification}
                    className="toggle toggle-success"
                    onChange={props.handleUpdateNotifications}
                  />
                </div>
              </li>
            </ul>
          </div>
          <div className="flex flex-col gap-2 mt-auto">
            <button onClick={props.handleSignOut} className="btn">
              <LogOut size={14} />
              Sign Out
            </button>
            <div className="flex gap-2 items-center">
              <UserRound size={14} />
              <span>{props.userEmail || ""}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
