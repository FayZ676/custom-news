import { Suspense } from "react";
import { signOut, getAuthenticatedUser } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";
import {
  getUserSettings,
  updateUserNotificationSettings,
  updateUserTheme,
} from "@/lib/supabase/queries/user_settings";

import { Footer, FooterSkeleton } from "@/components/Footer";
import { ThemedLogo } from "@/components/ThemedLogo";

// ---------------------------------------------------------------------------
// Shared async sub-components
// ---------------------------------------------------------------------------

async function FooterContent() {
  const { userId, email } = await getAuthenticatedUser();

  async function fetchSettings() {
    "use server";
    const supabase = await createClient();
    return getUserSettings(supabase, userId);
  }

  async function handleUpdateNotifications(newValue: boolean) {
    "use server";
    const supabase = await createClient();
    await updateUserNotificationSettings(supabase, userId, newValue);
  }

  async function handleUpdateTheme(newTheme: string) {
    "use server";
    const supabase = await createClient();
    await updateUserTheme(supabase, userId, newTheme);
  }

  return (
    <Footer
      userEmail={email}
      handleSignOut={signOut}
      fetchSettings={fetchSettings}
      handleUpdateNotifications={handleUpdateNotifications}
      handleUpdateTheme={handleUpdateTheme}
    />
  );
}

// ---------------------------------------------------------------------------
// Layout
// ---------------------------------------------------------------------------

export default function FeedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col flex-1 max-w-app mx-auto w-full">
      <div className="flex justify-center">
        <ThemedLogo />
      </div>

      {children}

      <div className="min-h-4 flex-1" />

      <Suspense fallback={<FooterSkeleton />}>
        <FooterContent />
      </Suspense>
    </div>
  );
}
