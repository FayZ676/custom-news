import { Suspense } from "react";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { ArticleCard } from "@/components/ArticleCard";
import { getUserInterests } from "@/lib/data/interests";
import { getArticlesForInterest } from "@/lib/data/articles";

async function FeedContent() {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  if (!claimsData) throw new Error("Not authenticated");

  const userId = claimsData.claims.sub;
  const interests = await getUserInterests(userId);
  if (!interests || interests.length === 0) redirect("/onboarding");

  const articlesByInterest = await Promise.all(
    interests.map((interest) => getArticlesForInterest(userId, interest.id)),
  );

  return (
    <div>
      {interests.map((interest, i) => {
        const articles = articlesByInterest[i];
        return (
          <details key={interest.id} open={i === 0}>
            <summary>{interest.query}</summary>
            <div className="flex flex-col gap-2">
              {articles?.length ? (
                articles.map(({ score, global_articles: article }) => {
                  if (!article) return null;
                  return (
                    <ArticleCard
                      key={article.id}
                      article={article}
                      score={score}
                    />
                  );
                })
              ) : (
                <p>No articles available.</p>
              )}
            </div>
          </details>
        );
      })}
    </div>
  );
}

export default function FeedPage() {
  return (
    <Suspense fallback={<div>Loading feed ...</div>}>
      <FeedContent />
    </Suspense>
  );
}
