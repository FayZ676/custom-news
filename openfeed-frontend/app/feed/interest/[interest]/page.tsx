import { Suspense } from "react";
import { redirect } from "next/navigation";

import { readUserArticle } from "@/lib/backend";
import { createClient } from "@/lib/supabase/server";
import { getUserInterests } from "@/lib/data/interests";

import { FeedDrawer } from "@/components/Navbar";
import { MenuDrawer } from "@/components/MenuDrawer";
import { ArticleCard } from "@/components/ArticleCard";
import { InterestOptionsDrawer } from "@/components/InterestOptionsDrawer";

import { getUserArticlesForInterest } from "@/lib/backend";

async function FeedContent({ interestId }: { interestId: string }) {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  if (!claimsData) throw new Error("Not authenticated");

  const userId = claimsData.claims.sub;
  const interests = await getUserInterests(userId);

  if (!interests || interests.length === 0) {
    redirect("/feed");
  }

  const activeInterest =
    interests.find((i) => i.id === interestId) ?? interests[0];
  const articles = await getUserArticlesForInterest(userId, activeInterest.id);

  async function handleOpenArticle(articleId: string, isRead: boolean) {
    "use server";
    if (!isRead) {
      await readUserArticle(userId, articleId);
    }
  }

  return (
    <div className="flex flex-col">
      <FeedDrawer
        left={<MenuDrawer interests={interests} />}
        center={
          <span className="text-xl font-semibold">{activeInterest.query}</span>
        }
        right={<InterestOptionsDrawer interestId={activeInterest.id} />}
      />
      <div className="flex flex-col gap-2 p-4">
        {articles?.length ? (
          articles.map((article) => {
            if (!article) return null;
            return (
              <ArticleCard
                key={article.id}
                article={article}
                handleOpen={handleOpenArticle}
              />
            );
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
