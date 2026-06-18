import { Suspense } from "react";
import { redirect } from "next/navigation";

import { getAuthenticatedUser } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";
import { getUserInterests } from "@/lib/supabase/queries/user_interests";
import { getGlobalSources } from "@/lib/supabase/queries/global_sources";
import type { FeedDefinition } from "@/lib/providers/types";
import OnboardingQueryBuilder from "./OnboardingQueryBuilder";

const NEWSDATA_SOURCE: FeedDefinition = {
  key: "newsdata",
  label: "Default News Data",
  feedUrl: "",
};

async function OnboardingContent() {
  const supabase = await createClient();
  const { userId } = await getAuthenticatedUser();

  const interests = await getUserInterests(supabase, userId);
  if (interests.length > 0) redirect("/feed");

  const rssFeeds = await getGlobalSources(supabase);
  const availableSources = [NEWSDATA_SOURCE, ...rssFeeds];

  return (
    <OnboardingQueryBuilder userId={userId} availableSources={availableSources} />
  );
}

export default function OnboardingPage() {
  return (
    <Suspense>
      <OnboardingContent />
    </Suspense>
  );
}
