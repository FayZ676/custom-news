"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Database } from "@/lib/supabase/supabase.types";

import { Forminit } from "forminit";

interface FooterProps {
  userEmail: string;
  userSettings: Database["public"]["Tables"]["user_settings"]["Row"];
  handleSignOut: () => Promise<void>;
  handleUpdateNotifications: () => Promise<void>;
  handleUpdateTheme: () => Promise<void>;
}

export function Footer({
  userEmail,
  userSettings,
  handleSignOut,
  handleUpdateNotifications,
  handleUpdateTheme,
}: FooterProps) {
  const router = useRouter();

  const [signingOut, setSigningOut] = useState(false);
  const [emailNotification, setEmailNotification] = useState(
    userSettings.email_notification,
  );
  const [colorTheme, setColorTheme] = useState(userSettings.color_theme);

  async function handleToggleNotifications() {
    setEmailNotification((prev) => !prev);
    try {
      await handleUpdateNotifications();
    } catch {
      setEmailNotification((prev) => !prev);
    }
    router.refresh();
  }

  async function handleToggleTheme() {
    setColorTheme((prev) => (prev === "cupcake" ? "black" : "cupcake"));
    try {
      await handleUpdateTheme();
    } catch {
      setColorTheme((prev) => (prev === "cupcake" ? "black" : "cupcake"));
    }
    router.refresh();
  }

  return (
    <footer className="text-sm bg-accent/15 p-3">
      <div className="flex flex-col gap-4 divide-y divide-neutral-400">
        <div>
          <button
            onClick={handleToggleNotifications}
            className="cursor-pointer hover:font-bold hover:underline pb-3"
          >
            Email Notifications ({emailNotification ? "On" : "Off"})
          </button>
        </div>
        <div>
          <button
            onClick={handleToggleTheme}
            className="cursor-pointer hover:font-bold hover:underline pb-3"
          >
            Theme ({colorTheme === "cupcake" ? "Light" : "Dark"})
          </button>
        </div>
        <div>
          <button
            onClick={async () => {
              setSigningOut(true);
              await handleSignOut();
            }}
            disabled={signingOut}
            className="cursor-pointer hover:font-bold hover:underline disabled:opacity-50 pb-3"
          >
            {signingOut ? "Signing out…" : "Sign Out"}
          </button>
        </div>
        <span className="italic">{userEmail}</span>
      </div>
    </footer>
  );
}

export function FooterSkeleton() {
  return (
    <footer className="mt-auto text-sm">
      <div>
        <div className="flex border-b py-3">
          <div className="skeleton h-4 w-48 rounded" />
        </div>
        <div className="flex border-b py-3">
          <div className="skeleton h-4 w-20 rounded" />
        </div>
        <div className="skeleton h-4 w-44 rounded my-3" />
      </div>
    </footer>
  );
}
