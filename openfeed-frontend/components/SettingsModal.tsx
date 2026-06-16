"use client";

import { forwardRef, useImperativeHandle, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { Database } from "@/lib/supabase/supabase.types";

import Modal from "@/components/Modal";

type UserSettings = Database["public"]["Tables"]["user_settings"]["Row"];

export interface SettingsModalHandle {
  open: () => void;
}

interface SettingsModalProps {
  fetchSettings: () => Promise<UserSettings>;
  handleUpdateNotifications: (newValue: boolean) => Promise<void>;
  handleUpdateTheme: (newTheme: string) => Promise<void>;
  handleSignOut: () => Promise<void>;
}

export const SettingsModal = forwardRef<
  SettingsModalHandle,
  SettingsModalProps
>(
  (
    {
      fetchSettings,
      handleUpdateNotifications,
      handleUpdateTheme,
      handleSignOut,
    },
    ref,
  ) => {
    const router = useRouter();
    const dialogRef = useRef<HTMLDialogElement>(null);

    type Status = "idle" | "loading" | "loaded" | "error";
    const [status, setStatus] = useState<Status>("idle");
    const [emailNotification, setEmailNotification] = useState(false);
    const [colorTheme, setColorTheme] = useState("light");
    const [signingOut, setSigningOut] = useState(false);

    useImperativeHandle(ref, () => ({
      async open() {
        setStatus("loading");
        dialogRef.current?.showModal();
        try {
          const s = await fetchSettings();
          setEmailNotification(s.email_notification);
          setColorTheme(s.color_theme);
          setStatus("loaded");
        } catch {
          setStatus("error");
        }
      },
    }));

    async function handleToggleNotifications() {
      const next = !emailNotification;
      setEmailNotification(next);
      try {
        await handleUpdateNotifications(next);
      } catch {
        setEmailNotification(!next);
      }
      router.refresh();
    }

    async function handleToggleTheme() {
      const next = colorTheme === "light" ? "dark" : "light";
      setColorTheme(next);
      document.documentElement.dataset.theme = next;
      try {
        localStorage.setItem("color-theme", next);
      } catch {}
      try {
        await handleUpdateTheme(next);
      } catch {
        setColorTheme(colorTheme);
        document.documentElement.dataset.theme = colorTheme;
        try {
          localStorage.setItem("color-theme", colorTheme);
        } catch {}
      }
      router.refresh();
    }

    return (
      <Modal ref={dialogRef}>
        <div className="flex flex-col gap-4">
          <h3 className="heading-modal">Settings</h3>

          {status === "loading" && (
            <p className="text-sm">Fetching your settings…</p>
          )}

          {status === "error" && (
            <p className="text-sm text-error">
              Failed to load settings. Please try again.
            </p>
          )}

          {status === "loaded" && (
            <div className="flex flex-col gap-4 divide-y divide-base-300">
              <div>
                <button
                  onClick={handleToggleNotifications}
                  className="btn-text pb-3"
                >
                  Email Notifications ({emailNotification ? "On" : "Off"})
                </button>
              </div>
              <div>
                <button
                  onClick={handleToggleTheme}
                  className="btn-text pb-3"
                >
                  Theme ({colorTheme === "light" ? "Light" : "Dark"})
                </button>
              </div>
              <div>
                <button
                  onClick={async () => {
                    setSigningOut(true);
                    await handleSignOut();
                  }}
                  disabled={signingOut}
                  className="btn-text pb-3"
                >
                  {signingOut ? "Signing out…" : "Sign Out"}
                </button>
              </div>
            </div>
          )}
        </div>
      </Modal>
    );
  },
);

SettingsModal.displayName = "SettingsModal";
