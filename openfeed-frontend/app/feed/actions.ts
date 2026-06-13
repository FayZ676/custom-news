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
  embedding: number[] | null,
): Promise<UserInterest> {
  const supabase = await createClient();
  return addUserInterest(supabase, userId, interestText, embedding);
}

export async function refreshArticlesAction(userId: string): Promise<void> {
  const supabase = await createClient();
  const interests = await getUserInterests(supabase, userId);
  await ingestArticlesForInterests(
    userId,
    interests.map((i) => i.interest_text),
  );
}

export async function ingestForInterestAction(
  userId: string,
  interestText: string,
): Promise<void> {
  await ingestArticlesForInterests(userId, [interestText]);
}

export async function rebuildFeedAction(userId: string): Promise<void> {
  const supabase = await createClient();
  const interests = await getUserInterests(supabase, userId);
  await deleteAllUserArticles(createServiceRoleClient(), userId);
  await ingestArticlesForInterests(
    userId,
    interests.map((i) => i.interest_text),
  );
}

export async function removeInterestAction(
  userId: string,
  interestId: string,
): Promise<void> {
  const supabase = await createClient();
  return removeUserInterest(supabase, userId, interestId);
}
