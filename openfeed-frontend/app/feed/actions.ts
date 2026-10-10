"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getAuthenticatedUser } from "@/lib/supabase/auth";
import { createShareLink } from "@/lib/supabase/queries/global_share_links";
import {
  addUserInterest,
  removeUserInterest,
  updateUserInterest,
} from "@/lib/supabase/queries/user_interests";
import {
  deleteUnreadArticlesForInterest,
  markArticleRead,
} from "@/lib/supabase/queries/user_articles";
import { deleteMatchesForInterest } from "@/lib/supabase/queries/user_article_matches";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { setFeedLastSeen } from "@/lib/supabase/queries/user_settings";
import { matchInterest, previewInterest } from "@/lib/pipeline/match";

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

export interface PreviewArticle {
  id: string;
  title: string;
  source_name: string;
  url: string;
  published_at: string;
  similarity: number;
  relevant: boolean;
  reason: string;
}

export async function previewInterestAction(
  interestText: string,
): Promise<PreviewArticle[]> {
  await getAuthenticatedUser();
  const judged = await previewInterest(interestText);
  return judged.map((a) => ({
    id: a.id,
    title: a.title,
    source_name: a.source_name,
    url: a.url,
    published_at: a.published_at,
    similarity: a.similarity,
    relevant: a.judgment.relevant,
    reason: a.judgment.reason,
  }));
}

// Interests are matched right away so the feed fills in without waiting for
// the next scheduled run.
export async function saveInterestAction(interestText: string): Promise<void> {
  const supabase = await createClient();
  const { userId } = await getAuthenticatedUser();
  const interest = await addUserInterest(supabase, userId, interestText);
  await matchInterest(interest.id);
  revalidatePath("/feed");
}

export async function updateInterestAction(
  interestId: string,
  interestText: string,
): Promise<void> {
  const supabase = await createClient();
  const { userId } = await getAuthenticatedUser();
  await updateUserInterest(supabase, userId, interestId, interestText);

  // Old decisions were made against the old text, so judge from scratch.
  const serviceClient = createServiceRoleClient();
  await deleteMatchesForInterest(serviceClient, interestId);
  await deleteUnreadArticlesForInterest(serviceClient, interestId);
  await matchInterest(interestId);
  revalidatePath("/feed");
}

export async function deleteInterestAction(interestId: string): Promise<void> {
  const supabase = await createClient();
  const { userId } = await getAuthenticatedUser();
  await removeUserInterest(supabase, userId, interestId);
  revalidatePath("/feed");
}
