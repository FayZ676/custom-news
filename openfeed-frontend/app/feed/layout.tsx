import { Suspense } from "react";
import { cacheLife } from "next/cache";

import { createAnonClient } from "@/lib/supabase/anon";
import { signOut, getAuthenticatedUser } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";
import { getGlobalFeeds } from "@/lib/supabase/queries/global_feeds";
import {
  getUserSettings,
  updateUserNotificationSettings,
  updateUserTheme,
} from "@/lib/supabase/queries/user_settings";
import { getCurrentDate } from "@/lib/utils";

import { getStoriesCount } from "@/lib/supabase/queries/global_stories";
import { getUnreadArticleCount } from "@/lib/supabase/queries/user_articles";

import { Banner, BannerSkeleton } from "@/components/Banner";
import { Footer, FooterSkeleton } from "@/components/Footer";
import { ThemedLogo } from "@/components/ThemedLogo";
import { TabSwitcher, TabSwitcherSkeleton } from "@/components/TabSwitcher";
import { UnreadCountProvider } from "@/components/UnreadCountContext";

// ---------------------------------------------------------------------------
// Shared async sub-components
// ---------------------------------------------------------------------------

async function BannerContent() {
  "use cache";
  cacheLife("hours");
  const supabase = createAnonClient();
  const date = getCurrentDate();
  const feeds = await getGlobalFeeds(supabase);
  return <Banner date={date} feeds={feeds} />;
}

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
// TabSwitcherContent — fetches tab counts then seeds context + renders TabSwitcher
// ---------------------------------------------------------------------------

async function TabSwitcherContent({ children }: { children: React.ReactNode }) {
  const { userId } = await getAuthenticatedUser();
  const supabase = await createClient();
  const anonSupabase = createAnonClient();

  const [unreadCount, storiesCount] = await Promise.all([
    getUnreadArticleCount(supabase, userId),
    getStoriesCount(anonSupabase),
  ]);

  return (
    <UnreadCountProvider initialCount={unreadCount}>
      <TabSwitcher storiesCount={storiesCount} />
      {children}
    </UnreadCountProvider>
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
    <div className="flex flex-col gap-4 flex-1">
      <div className="flex justify-center">
        <ThemedLogo />
      </div>

      <Suspense fallback={<BannerSkeleton />}>
        <BannerContent />
      </Suspense>

      <Suspense fallback={<TabSwitcherSkeleton />}>
        <TabSwitcherContent>{children}</TabSwitcherContent>
      </Suspense>

      <div className="min-h-4 flex-1" />

      <Suspense fallback={<FooterSkeleton />}>
        <FooterContent />
      </Suspense>
    </div>
  );
}
