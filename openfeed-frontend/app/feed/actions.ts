"use server";

import { createClient } from "@/lib/supabase/server";
import { createShareLink } from "@/lib/supabase/queries/global_share_links";
import {
  addUserInterest,
  getUserInterests,
  removeUserInterest,
  UserInterest,
} from "@/lib/supabase/queries/user_interests";
import { ingestArticlesForInterests } from "@/lib/articles/ingest";
import { deleteAllUserArticles } from "@/lib/supabase/queries/user_articles";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import {
  addUserSource,
  getUserSourceKeys,
  removeUserSource,
} from "@/lib/supabase/queries/user_sources";
import { getSourcesByKeys } from "@/lib/supabase/queries/sources";
import type { FeedDefinition } from "@/lib/providers/types";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/supabase.types";
import type { NewsQueryPayload } from "@/lib/interests/refine";

async function getSubscribedFeeds(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<FeedDefinition[]> {
  const keys = await getUserSourceKeys(supabase, userId);
  return getSourcesByKeys(supabase, keys);
}

export async function createShareLinkAction(
  userId: string,
  contentType: "article",
  contentId: string,
): Promise<string> {
  const supabase = await createClient();
  return createShareLink(supabase, userId, contentType, contentId);
}

export async function addInterestAction(
  userId: string,
  interestText: string,
  queryPayload: NewsQueryPayload | null = null,
): Promise<UserInterest> {
  const supabase = await createClient();
  return addUserInterest(supabase, userId, interestText, queryPayload);
}

export async function refreshArticlesAction(userId: string): Promise<void> {
  const supabase = await createClient();
  const interests = await getUserInterests(supabase, userId);
  const feeds = await getSubscribedFeeds(supabase, userId);
  await ingestArticlesForInterests(userId, interests, feeds);
}

export async function ingestForInterestAction(
  userId: string,
  interest: UserInterest,
): Promise<void> {
  const supabase = await createClient();
  const feeds = await getSubscribedFeeds(supabase, userId);
  await ingestArticlesForInterests(userId, [interest], feeds);
}

export async function rebuildFeedAction(userId: string): Promise<void> {
  const supabase = await createClient();
  const interests = await getUserInterests(supabase, userId);
  const feeds = await getSubscribedFeeds(supabase, userId);
  await deleteAllUserArticles(createServiceRoleClient(), userId);
  await ingestArticlesForInterests(userId, interests, feeds);
}

export async function subscribeSourceAction(
  userId: string,
  sourceKey: string,
): Promise<void> {
  const supabase = await createClient();
  await addUserSource(supabase, userId, sourceKey);
}

export async function unsubscribeSourceAction(
  userId: string,
  sourceKey: string,
): Promise<void> {
  const supabase = await createClient();
  await removeUserSource(supabase, userId, sourceKey);
}

export async function removeInterestAction(
  userId: string,
  interestId: string,
): Promise<void> {
  const supabase = await createClient();
  return removeUserInterest(supabase, userId, interestId);
}
