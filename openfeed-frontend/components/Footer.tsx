"use client";

import { useState } from "react";

import {
  LogOut,
  MessageSquare,
  MessageSquareCheck,
  UserRound,
} from "lucide-react";

import { Database } from "@/lib/supabase/supabase.types";

import { Forminit } from "forminit";

interface FooterProps {
  userEmail: string;
  userSettings: Database["public"]["Tables"]["user_settings"]["Row"];
  handleSignOut: () => Promise<void>;
  handleUpdateNotifications: () => Promise<void>;
}

export function Footer({
  userEmail,
  userSettings,
  handleSignOut,
  handleUpdateNotifications,
}: FooterProps) {
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackSent, setFeedbackSent] = useState(false);

  const forminit = new Forminit({ proxyUrl: "/api/forminit" });

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
      formData.append("fi-sender-email", userEmail);
      formData.append("fi-text-message", feedbackText);
      setFeedbackText("");
      setFeedbackOpen(false);
      setFeedbackSent(true);
      setTimeout(() => setFeedbackSent(false), 3000);
      await forminit.submit("12sccwhqsbm", formData);
    }
  }

  return (
    <footer>
      <ul>
        <li>
          <div className="flex justify-between items-center gap-2 border-b border-base-300 py-3">
            <span className="font-semibold truncate min-w-0">
              Email Notifications
            </span>
            <input
              type="checkbox"
              defaultChecked={userSettings.email_notification}
              className="toggle toggle-success"
              onChange={handleUpdateNotifications}
            />
          </div>
        </li>
      </ul>
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
      <button onClick={handleSignOut} className="btn btn-accent justify-start">
        <LogOut size={14} />
        Sign Out
      </button>
      <div className="flex gap-2 items-center mt-auto">
        <UserRound size={14} />
        <span>{userEmail}</span>
      </div>
    </footer>
  );
}

export function FooterSkeleton() {
  return "Footer here";
}
