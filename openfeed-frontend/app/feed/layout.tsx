import Link from "next/link";
import Image from "next/image";
import { Suspense } from "react";
import { cacheLife } from "next/cache";

import { createAnonClient } from "@/lib/supabase/anon";
import { signOut, getAuthenticatedUser } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";
import { getGlobalFeeds } from "@/lib/supabase/queries/global_feeds";
import {
  getCachedUserSettings,
  updateUserNotificationSettings,
  updateUserTheme,
} from "@/lib/supabase/queries/user_settings";
import { getCurrentDate } from "@/lib/utils";

import { Banner, BannerSkeleton } from "@/components/Banner";
import { Footer, FooterSkeleton } from "@/components/Footer";
import { TabSwitcher } from "@/components/TabSwitcher";
import { UnreadCountProvider } from "@/components/UnreadCountContext";

// ---------------------------------------------------------------------------
// Shared async sub-components
// ---------------------------------------------------------------------------

function LogoSkeleton() {
  return <div className="skeleton h-16 w-75 rounded mx-auto" />;
}

async function LogoContent() {
  const { userId } = await getAuthenticatedUser();
  const userSettings = await getCachedUserSettings(userId);
  return (
    <Link href="/" aria-label="Go to The Latest Times feed">
      <Image
        src={
          userSettings.color_theme === "cupcake"
            ? "/logo-light.svg"
            : "/logo-dark.svg"
        }
        alt="The Latest Times"
        width={300}
        height={300}
        loading="eager"
        style={{ height: "auto" }}
      />
    </Link>
  );
}

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
  const userSettings = await getCachedUserSettings(userId);

  async function handleUpdateNotifications() {
    "use server";
    const supabase = await createClient();
    await updateUserNotificationSettings(
      supabase,
      userId,
      !userSettings.email_notification,
    );
  }

  async function handleUpdateTheme() {
    "use server";
    const supabase = await createClient();
    const next = userSettings.color_theme === "cupcake" ? "black" : "cupcake";
    await updateUserTheme(supabase, userId, next);
  }

  return (
    <Footer
      userEmail={email}
      userSettings={userSettings}
      handleSignOut={signOut}
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
    <div className="flex flex-col gap-4 flex-1">
      <div className="flex justify-center">
        <Suspense fallback={<LogoSkeleton />}>
          <LogoContent />
        </Suspense>
      </div>

      <Suspense fallback={<BannerSkeleton />}>
        <BannerContent />
      </Suspense>

      <UnreadCountProvider initialCount={0}>
        <TabSwitcher />
        {children}
      </UnreadCountProvider>

      <div className="min-h-4 flex-1" />

      <Suspense fallback={<FooterSkeleton />}>
        <FooterContent />
      </Suspense>
    </div>
  );
}
