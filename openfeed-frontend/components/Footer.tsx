"use client";

import { useRef } from "react";

import { Database } from "@/lib/supabase/supabase.types";

import {
  FeedbackModal,
  type FeedbackModalHandle,
} from "@/components/FeedbackModal";
import {
  SettingsModal,
  type SettingsModalHandle,
} from "@/components/SettingsModal";

type UserSettings = Database["public"]["Tables"]["user_settings"]["Row"];

interface FooterProps {
  userEmail: string;
  handleSignOut: () => Promise<void>;
  fetchSettings: () => Promise<UserSettings>;
  handleUpdateNotifications: (newValue: boolean) => Promise<void>;
  handleUpdateTheme: (newTheme: string) => Promise<void>;
}

export function Footer({
  userEmail,
  handleSignOut,
  fetchSettings,
  handleUpdateNotifications,
  handleUpdateTheme,
}: FooterProps) {
  const feedbackModalRef = useRef<FeedbackModalHandle>(null);
  const settingsModalRef = useRef<SettingsModalHandle>(null);

  return (
    <footer className="text-sm pt-4">
      <div className="flex flex-col gap-4 divide-y divide-base-300">
        <div>
          <button
            onClick={() => feedbackModalRef.current?.open()}
            className="btn-text pb-3"
          >
            Send Feedback
          </button>
        </div>
        <div>
          <button
            onClick={() => settingsModalRef.current?.open()}
            className="btn-text pb-3"
          >
            Settings
          </button>
        </div>
        <span className="btn-text italic">{userEmail}</span>
      </div>

      <FeedbackModal ref={feedbackModalRef} userEmail={userEmail} />
      <SettingsModal
        ref={settingsModalRef}
        fetchSettings={fetchSettings}
        handleUpdateNotifications={handleUpdateNotifications}
        handleUpdateTheme={handleUpdateTheme}
        handleSignOut={handleSignOut}
      />
    </footer>
  );
}

export function FooterSkeleton() {
  return (
    <footer className="mt-auto text-sm">
      <div>
        <div className="flex border-b py-3">
          <div className="skeleton h-4 w-28 rounded" />
        </div>
        <div className="flex border-b py-3">
          <div className="skeleton h-4 w-16 rounded" />
        </div>
        <div className="skeleton h-4 w-44 rounded my-3" />
      </div>
    </footer>
  );
}
