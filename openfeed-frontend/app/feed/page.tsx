import { Suspense } from "react";

import { getAuthenticatedUser } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";
import { getDigestFeed } from "@/lib/supabase/queries/global_articles";
import {
  groupMetadataOptionsByField,
  getGlobalArticleMetadataOptions,
} from "@/lib/supabase/queries/global_article_metadata_options";
import {
  getUserArticleMetadataOptions,
  groupUserMetadataByField,
} from "@/lib/supabase/queries/user_article_metadata_options";
import {
  changeMetadataOptionsAction,
  createShareLinkAction,
} from "@/app/feed/actions";

import { FeedPageContent } from "@/components/FeedPageContent";
import { ViewFeedSkeleton } from "@/components/ViewFeed";
import { ShareLinkProvider } from "@/components/ShareLinkContext";

const DIGEST_SIZE = 10;

async function ViewFeedContent() {
  const supabase = await createClient();
  const { userId } = await getAuthenticatedUser();

  const [globalMetadataOptions, userMetadataRows] = await Promise.all([
    getGlobalArticleMetadataOptions(supabase),
    getUserArticleMetadataOptions(supabase, userId),
  ]);
  const metadataOptions = groupMetadataOptionsByField(globalMetadataOptions);
  const initialMetadataFilters = groupUserMetadataByField(userMetadataRows);

  const articles = await getDigestFeed(supabase, {
    metadataFilters: initialMetadataFilters,
    feedSize: DIGEST_SIZE,
  });

  const handleCreateShareLink = createShareLinkAction.bind(null, userId);
  const handleChangeMetadataOptions = changeMetadataOptionsAction.bind(
    null,
    userId,
  );

  return (
    <ShareLinkProvider handleCreateShareLink={handleCreateShareLink}>
      <FeedPageContent
        articles={articles}
        metadataOptions={metadataOptions}
        initialMetadataFilters={initialMetadataFilters}
        onChangeMetadataOptions={handleChangeMetadataOptions}
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
