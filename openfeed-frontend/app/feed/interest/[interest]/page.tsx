import { Suspense } from "react";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { getUserInterests } from "@/lib/data/interests";
import { getUserCategories } from "@/lib/data/subscription";
import { getArticlesForInterest } from "@/lib/data/articles";

import { FeedDrawer } from "@/components/FeedDrawer";
import { ArticleCard } from "@/components/ArticleCard";

async function FeedContent({ interestId }: { interestId: string }) {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  if (!claimsData) throw new Error("Not authenticated");

  const userId = claimsData.claims.sub;
  const interests = await getUserInterests(userId);

  if (!interests || interests.length === 0) {
    const categories = await getUserCategories(userId);
    if (categories && categories.length > 0) {
      redirect("/feed/new-interest");
    }
    redirect("/onboarding");
  }

  const activeInterest =
    interests.find((i) => i.id === interestId) ?? interests[0];
  const articles = await getArticlesForInterest(userId, activeInterest.id);

  return (
    <div className="flex flex-col">
      <FeedDrawer interests={interests} activeInterest={activeInterest} />
      <div className="flex flex-col gap-2 p-4">
        {articles?.length ? (
          articles.map(({ global_articles: article }) => {
            if (!article) return null;
            return <ArticleCard key={article.id} article={article} />;
          })
        ) : (
          <p className="text-center text-base-content/50 py-8">
            No articles available.
          </p>
        )}
      </div>
    </div>
  );
}

export default async function InterestFeedPage({
  params,
}: {
  params: Promise<{ interest: string }>;
}) {
  const { interest } = await params;
  return (
    <Suspense fallback={<div>Loading feed...</div>}>
      <FeedContent interestId={interest} />
    </Suspense>
  );
}
