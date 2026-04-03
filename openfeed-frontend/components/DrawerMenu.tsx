"use client";

import Link from "next/link";
import { useRef, useState } from "react";

import {
  Search,
  LogOut,
  Menu,
  UserRound,
  MessageSquare,
  MessageSquareCheck,
} from "lucide-react";
import { Forminit } from "forminit";

import { Interest } from "@/lib/backend";
import { Database } from "@/lib/supabase/supabase.types";

const forminit = new Forminit({ proxyUrl: "/api/forminit" });

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
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackSent, setFeedbackSent] = useState(false);

  function closeDrawer() {
    if (checkboxRef.current) {
      checkboxRef.current.checked = false;
    }
  }

  function dismissFeedback() {
    setFeedbackText("");
    setFeedbackOpen(false);
  }

  async function handleFeedbackKeyDown(
    e: React.KeyboardEvent<HTMLTextAreaElement>,
  ) {
    if (e.key === "Enter" && !e.shiftKey && feedbackText.trim()) {
      e.preventDefault();
      const formData = new FormData();
      formData.append("fi-sender-email", props.userEmail ?? "");
      formData.append("fi-text-message", feedbackText);
      setFeedbackText("");
      setFeedbackOpen(false);
      setFeedbackSent(true);
      setTimeout(() => setFeedbackSent(false), 3000);
      await forminit.submit("12sccwhqsbm", formData);
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
        <label
          htmlFor="my-drawer-1"
          className="drawer-button btn btn-circle btn-ghost"
        >
          <div className="indicator">
            {props.interests.some((i) => i.unreadArticlesCount > 0) && (
              <span className="indicator-item status status-success status-md"></span>
            )}
            <Menu />
          </div>
        </label>
      </div>
      <div className="drawer-side">
        <label
          htmlFor="my-drawer-1"
          aria-label="close sidebar"
          className="drawer-overlay"
        ></label>
        <div className="flex flex-col gap-8 bg-base-100 min-h-full w-80 p-4">
          <div className="collapse collapse-arrow rounded-none">
            <input type="checkbox" defaultChecked />
            <span className="collapse-title text-xl font-bold p-0">
              Interests
            </span>
            <ul className="collapse-content p-1">
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
            <div className="collapse-content p-1 flex flex-col gap-4">
              <ul>
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
              <div className="flex flex-col gap-2">
                {feedbackOpen ? (
                  <textarea
                    className="textarea w-full rounded-lg"
                    placeholder="Feedback (Enter to send)"
                    rows={4}
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                    onKeyDown={handleFeedbackKeyDown}
                    onBlur={dismissFeedback}
                    autoFocus
                  />
                ) : (
                  <button
                    onClick={() => !feedbackSent && setFeedbackOpen(true)}
                    className="btn btn-accent justify-start"
                    disabled={feedbackSent}
                  >
                    {feedbackSent ? (
                      <>
                        <MessageSquareCheck size={14} />
                        Message Received
                      </>
                    ) : (
                      <>
                        <MessageSquare size={14} />
                        Feedback & Support
                      </>
                    )}
                  </button>
                )}
                <button
                  onClick={props.handleSignOut}
                  className="btn btn-accent justify-start"
                >
                  <LogOut size={14} />
                  Sign Out
                </button>
              </div>
            </div>
          </div>
          <div className="flex gap-2 items-center mt-auto">
            <UserRound size={14} />
            <span>{props.userEmail || ""}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
