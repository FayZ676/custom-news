"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createShareLink } from "@/lib/supabase/queries/global_share_links";
import {
  addUserInterest,
  getUserInterests,
  removeUserInterest,
  updateUserInterest,
  UserInterest,
} from "@/lib/supabase/queries/user_interests";
import { NewsQueryPayload } from "@/lib/interests/refine";
import { getSubscribedFeeds, ingestArticlesForInterests } from "@/lib/articles/ingest";
import {
  deleteAllUserArticles,
  deleteUserArticlesBySourceKey,
} from "@/lib/supabase/queries/user_articles";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { addUserSource, removeUserSource } from "@/lib/supabase/queries/user_sources";

function buildQueryPayload(
  all: string[],
  any: string[],
  sources: string[],
): NewsQueryPayload {
  return {
    q: null,
    qInTitle: null,
    category: null,
    country: null,
    timeframe: null,
    all,
    any,
    sources,
  };
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
): Promise<UserInterest> {
  const supabase = await createClient();
  return addUserInterest(supabase, userId, interestText);
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
  await deleteUserArticlesBySourceKey(
    createServiceRoleClient(),
    userId,
    sourceKey,
  );
}

export async function removeInterestAction(
  userId: string,
  interestId: string,
): Promise<void> {
  const supabase = await createClient();
  await removeUserInterest(supabase, userId, interestId);
}

export async function deleteQueryAction(
  userId: string,
  interestId: string,
): Promise<void> {
  const supabase = await createClient();
  await removeUserInterest(supabase, userId, interestId);
  await rebuildFeedAction(userId);
  revalidatePath("/feed");
}

export async function saveQueryAction(
  userId: string,
  name: string,
  all: string[],
  any: string[],
  sources: string[] = [],
): Promise<UserInterest> {
  const supabase = await createClient();
  const interest = await addUserInterest(
    supabase,
    userId,
    name,
    buildQueryPayload(all, any, sources),
  );
  const feeds = await getSubscribedFeeds(supabase, userId);
  await ingestArticlesForInterests(userId, [interest], feeds);
  revalidatePath("/feed");
  return interest;
}

export async function updateQueryAction(
  userId: string,
  interestId: string,
  name: string,
  all: string[],
  any: string[],
  sources: string[] = [],
): Promise<void> {
  const supabase = await createClient();
  await updateUserInterest(
    supabase,
    userId,
    interestId,
    name,
    buildQueryPayload(all, any, sources),
  );
  await rebuildFeedAction(userId);
  revalidatePath("/feed");
}
