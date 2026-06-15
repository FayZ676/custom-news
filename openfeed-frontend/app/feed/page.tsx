import { Suspense } from "react";
import { redirect } from "next/navigation";

import { getAuthenticatedUser } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";
import { getUserArticles } from "@/lib/supabase/queries/user_articles";
import { getUserInterests } from "@/lib/supabase/queries/user_interests";
import { getUserSourceKeys } from "@/lib/supabase/queries/user_sources";
import { getGlobalSources } from "@/lib/supabase/queries/global_sources";
import { createShareLinkAction } from "@/app/feed/actions";

import { FeedPageContent } from "@/components/FeedPageContent";
import { ViewFeedSkeleton } from "@/components/ViewFeed";
import { ShareLinkProvider } from "@/components/ShareLinkContext";

async function ViewFeedContent() {
  const supabase = await createClient();
  const { userId } = await getAuthenticatedUser();

  const interests = await getUserInterests(supabase, userId);

  if (interests.length === 0) {
    redirect("/onboarding");
  }

  const feedArticles = await getUserArticles(supabase, userId);
  const sources = await getGlobalSources(supabase);
  const subscribedSourceKeys = await getUserSourceKeys(supabase, userId);

  const handleCreateShareLink = createShareLinkAction.bind(null, userId);

  return (
    <ShareLinkProvider handleCreateShareLink={handleCreateShareLink}>
      <FeedPageContent
        articles={feedArticles}
        interests={interests}
        sources={sources}
        subscribedSourceKeys={subscribedSourceKeys}
        userId={userId}
      />
    </ShareLinkProvider>
  );
}

export default async function FeedPage() {
  return (
    <Suspense fallback={<ViewFeedSkeleton />}>
      <ViewFeedContent />
    </Suspense>
  );
}
