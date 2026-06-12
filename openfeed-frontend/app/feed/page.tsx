import { Suspense } from "react";
import { redirect } from "next/navigation";

import { getAuthenticatedUser } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";
import { getCuratedFeed } from "@/lib/supabase/queries/global_articles";
import {
  groupMetadataOptionsByField,
  getGlobalArticleMetadataOptions,
} from "@/lib/supabase/queries/global_article_metadata_options";
import {
  getUserArticleMetadataOptions,
  groupUserMetadataByField,
} from "@/lib/supabase/queries/user_article_metadata_options";
import { getUserInterests } from "@/lib/supabase/queries/user_interests";
import {
  changeMetadataOptionsAction,
  createShareLinkAction,
} from "@/app/feed/actions";

import { FeedPageContent } from "@/components/FeedPageContent";
import { ViewFeedSkeleton } from "@/components/ViewFeed";
import { ShareLinkProvider } from "@/components/ShareLinkContext";

async function ViewFeedContent() {
  const supabase = await createClient();
  const { userId } = await getAuthenticatedUser();

  const [globalMetadataOptions, userMetadataRows, interests] = await Promise.all([
    getGlobalArticleMetadataOptions(supabase),
    getUserArticleMetadataOptions(supabase, userId),
    getUserInterests(supabase, userId),
  ]);

  if (interests.length === 0) {
    redirect("/onboarding");
  }

  const metadataOptions = groupMetadataOptionsByField(globalMetadataOptions);
  const initialMetadataFilters = groupUserMetadataByField(userMetadataRows);

  const feedArticles = await getCuratedFeed(
    supabase,
    userId,
    interests,
    initialMetadataFilters.topic.length > 0
      ? initialMetadataFilters.topic
      : undefined,
  );

  const handleCreateShareLink = createShareLinkAction.bind(null, userId);
  const handleChangeMetadataOptions = changeMetadataOptionsAction.bind(
    null,
    userId,
  );

  return (
    <ShareLinkProvider handleCreateShareLink={handleCreateShareLink}>
      <FeedPageContent
        articles={feedArticles}
        metadataOptions={metadataOptions}
        initialMetadataFilters={initialMetadataFilters}
        onChangeMetadataOptions={handleChangeMetadataOptions}
        interests={interests}
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
