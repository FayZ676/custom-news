"use server";

import { cacheTag } from "next/cache";
import { createServiceRoleClient } from "@/lib/supabase/server";

export async function getArticlesForInterest(
  userId: string,
  interestId: string,
) {
  "use cache";
  cacheTag(`articles:${userId}`);

  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("user_article_scores")
    .select(
      "score, global_articles(id, title, url, summary, published_at, global_feeds(title))",
    )
    .eq("user_id", userId)
    .eq("interest_id", interestId)
    .order("score", { ascending: false });

  if (error) throw new Error(error.message);
  return data;
}
