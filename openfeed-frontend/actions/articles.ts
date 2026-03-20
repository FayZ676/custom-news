"use server";

import { createClient } from "@/lib/supabase/server";

export async function getArticlesForInterest(interestId: string) {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  if (!claimsData) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("user_article_scores")
    .select(
      "score, global_articles(id, title, url, summary, published_at, global_feeds(title))",
    )
    .eq("user_id", claimsData.claims.sub)
    .eq("interest_id", interestId)
    .order("score", { ascending: false });

  if (error) throw new Error(error.message);
  return data;
}
