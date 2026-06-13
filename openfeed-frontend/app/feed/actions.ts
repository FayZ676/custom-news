"use server";

import { createClient } from "@/lib/supabase/server";
import { createShareLink } from "@/lib/supabase/queries/global_share_links";
import { requestUserArticlesRefresh } from "@/lib/supabase/queries/user_articles";
import {
  addUserInterest,
  removeUserInterest,
  UserInterest,
} from "@/lib/supabase/queries/user_interests";

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

export async function removeInterestAction(
  userId: string,
  interestId: string,
): Promise<void> {
  const supabase = await createClient();
  return removeUserInterest(supabase, userId, interestId);
}

// Kick off an immediate refresh of the caller's feed after their interests
// change, so they don't have to wait for the hourly cron to populate articles.
export async function refreshUserArticlesAction(): Promise<void> {
  const supabase = await createClient();
  return requestUserArticlesRefresh(supabase);
}
