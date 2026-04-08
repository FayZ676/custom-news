"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import {
  LogOut,
  Mail,
  MessageSquare,
  MessageSquareCheck,
  UserRound,
  LogOutIcon,
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
  const router = useRouter();

  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [emailNotification, setEmailNotification] = useState(
    userSettings.email_notification,
  );

  const forminit = new Forminit({ proxyUrl: "/api/forminit" });

  function dismissFeedback() {
    setFeedbackText("");
    setFeedbackOpen(false);
  }

  async function handleToggleNotifications() {
    setEmailNotification((prev) => !prev);
    try {
      await handleUpdateNotifications();
    } catch {
      setEmailNotification((prev) => !prev); // revert on error
    }
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

  async function handleNotifications() {
    await handleToggleNotifications();
    router.refresh();
  }

  return (
    <footer className="mt-auto text-sm">
      <div>
        <div className="flex border-b py-3 justify-between">
          <span>Email Notifications</span>
          <div className="dropdown dropdown-bottom dropdown-end dropdown-hover">
            <Mail
              tabIndex={0}
              role="button"
              className="cursor-pointer"
              size={18}
            />
            <ul className="dropdown-content menu bg-base-100 rounded-none border z-1 w-52 p-2 shadow-sm not-italic">
              <li className="rounded-none">
                <button
                  onClick={handleNotifications}
                  className={`rounded-none ${emailNotification ? "font-bold underline" : ""}`}
                >
                  On
                </button>
              </li>
              <li className="rounded-none">
                <button
                  onClick={handleNotifications}
                  className={`rounded-none ${!emailNotification ? "font-bold underline" : ""}`}
                >
                  Off
                </button>
              </li>
            </ul>
          </div>
        </div>
        <div className="flex border-b py-3 justify-between">
          <span>Sign Out</span>
          <button
            onClick={async () => {
              await handleSignOut();
              router.refresh();
            }}
            className="cursor-pointer"
          >
            <LogOutIcon size={18} />
          </button>
        </div>
        <span className="flex py-3 italic">{userEmail}</span>
      </div>
    </footer>
  );
}

export function FooterSkeleton() {
  return "Footer here";
}
