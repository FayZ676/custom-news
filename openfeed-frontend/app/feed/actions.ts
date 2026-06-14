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
import type { NewsQueryPayload } from "@/lib/interests/refine";

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
  const sourceKeys = await getUserSourceKeys(supabase, userId);
  await ingestArticlesForInterests(userId, interests, sourceKeys);
}

export async function ingestForInterestAction(
  userId: string,
  interest: UserInterest,
): Promise<void> {
  const supabase = await createClient();
  const sourceKeys = await getUserSourceKeys(supabase, userId);
  await ingestArticlesForInterests(userId, [interest], sourceKeys);
}

export async function rebuildFeedAction(userId: string): Promise<void> {
  const supabase = await createClient();
  const interests = await getUserInterests(supabase, userId);
  const sourceKeys = await getUserSourceKeys(supabase, userId);
  await deleteAllUserArticles(createServiceRoleClient(), userId);
  await ingestArticlesForInterests(userId, interests, sourceKeys);
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
