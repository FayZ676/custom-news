"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getAuthenticatedUser } from "@/lib/supabase/auth";
import { createShareLink } from "@/lib/supabase/queries/global_share_links";
import {
  addUserInterest,
  getUserInterests,
  removeUserInterest,
  updateUserInterest,
  UserInterest,
} from "@/lib/supabase/queries/user_interests";
import {
  createNewsQueryPayload,
  NewsQueryPayload,
} from "@/lib/providers/newsdata";
import { ingestArticlesForInterests } from "@/lib/articles/ingest";
import {
  deleteAllUserArticles,
  markArticleRead,
} from "@/lib/supabase/queries/user_articles";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { setFeedLastSeen } from "@/lib/supabase/queries/user_settings";

function buildQueryPayload(
  all: string[],
  any: string[],
  sources: string[],
): NewsQueryPayload {
  return createNewsQueryPayload({ all, any, sources });
}

export async function createShareLinkAction(
  userId: string,
  contentType: "article",
  contentId: string,
): Promise<string> {
  const supabase = await createClient();
  return createShareLink(supabase, userId, contentType, contentId);
}

export async function markFeedSeenAction(userId: string): Promise<void> {
  const supabase = await createClient();
  await setFeedLastSeen(supabase, userId);
}

export async function markArticleReadAction(articleId: string): Promise<void> {
  const supabase = await createClient();
  const { userId } = await getAuthenticatedUser();
  await markArticleRead(supabase, userId, articleId);
  revalidatePath("/feed");
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
  await ingestArticlesForInterests(userId, interests);
}

export async function ingestForInterestAction(
  userId: string,
  interest: UserInterest,
): Promise<void> {
  await ingestArticlesForInterests(userId, [interest]);
}

export async function rebuildFeedAction(userId: string): Promise<void> {
  const supabase = await createClient();
  const interests = await getUserInterests(supabase, userId);
  await deleteAllUserArticles(createServiceRoleClient(), userId);
  await ingestArticlesForInterests(userId, interests);
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
  await ingestArticlesForInterests(userId, [interest]);
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
