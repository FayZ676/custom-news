import { Suspense } from "react";
import { redirect } from "next/navigation";

import { signOut } from "@/actions/auth";

import { createClient } from "@/lib/supabase/server";
import {
  readUserArticles,
  getUserInterests,
  getUserSettings,
  getUserArticlesForInterest,
  updateUserNotificationSettings,
} from "@/lib/backend";

import { ViewInterestFeed } from "@/components/ViewInterestFeed";
import { ViewFeedSkeleton } from "@/components/ViewFeedSkeleton";
import { DrawerMenuProps } from "@/components/DrawerMenu";

export default async function InterestFeedPage({
  params,
}: {
  params: Promise<{ interest: string }>;
}) {
  const { interest } = await params;
  return (
    <Suspense fallback={<ViewFeedSkeleton />}>
      <FeedContent interestId={interest} />
    </Suspense>
  );
}

async function FeedContent({ interestId }: { interestId: string }) {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  if (!claimsData) throw new Error("Not authenticated");
  const userId = claimsData.claims.sub;

  const interests = await getUserInterests(supabase, userId);

  if (!interests || interests.length === 0) redirect("/feed");

  const activeInterest =
    interests.find((i) => i.id === interestId) ?? interests[0];
  const articles = await getUserArticlesForInterest(
    supabase,
    userId,
    activeInterest.id,
  );

  const userSettings = await getUserSettings(supabase, userId);

  async function handleUpdateNotifications() {
    "use server";
    const supabase = await createClient();
    await updateUserNotificationSettings(
      supabase,
      userId,
      !userSettings.email_notification,
    );
  }

  const drawerMenuProps: DrawerMenuProps = {
    userEmail: claimsData.claims.email,
    interests: interests.map((i) => ({
      interest: i,
      unreadArticlesCount: i.unread_articles_count,
    })),
    handleSignOut: signOut,
    settings: userSettings,
    handleUpdateNotifications: handleUpdateNotifications,
  };

  async function handleReadArticles(articleIds: string[], isRead: boolean) {
    "use server";
    const supabase = await createClient();
    if (!isRead) await readUserArticles(supabase, userId, articleIds);
  }

  return (
    <ViewInterestFeed
      drawerMenuProps={drawerMenuProps}
      activeInterest={activeInterest}
      articles={articles}
      handleReadArticles={handleReadArticles}
    />
  );
}
