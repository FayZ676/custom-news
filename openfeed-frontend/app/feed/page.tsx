import Link from "next/link";
import { Suspense } from "react";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { ArticleCard } from "@/components/ArticleCard";
import { getUserInterests } from "@/lib/data/interests";
import { getArticlesForInterest } from "@/lib/data/articles";

function FeedSkeleton() {
  return (
    <div>
      <p>Loading feed ...</p>
    </div>
  );
}

function ArticleListSkeleton() {
  return (
    <div>
      <p>Loading articles ...</p>
    </div>
  );
}

async function ArticleList({
  userId,
  interestId,
}: {
  userId: string;
  interestId: string;
}) {
  const articles = await getArticlesForInterest(userId, interestId);
  if (!articles?.length) return <p>No articles available.</p>;

  return (
    <div className="flex flex-col gap-2">
      {articles.map(({ score, global_articles: article }) => {
        if (!article) return null;
        return <ArticleCard key={article.id} article={article} score={score} />;
      })}
    </div>
  );
}

async function FeedContent({
  searchParams,
}: {
  searchParams: Promise<{ interest?: string }>;
}) {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  if (!claimsData) throw new Error("Not authenticated");

  // const interests = await getUserInterests(claimsData.claims.sub);
  const interests = await getUserInterests();
  if (!interests || interests.length === 0) redirect("/onboarding");

  const { interest: interestId } = await searchParams;
  const activeInterestId = interestId ?? interests?.[0]?.id;

  return (
    <div>
      <nav>
        {interests.map((interest) => (
          <Link key={interest.id} href={`/feed?interest=${interest.id}`}>
            {interest.query}
          </Link>
        ))}
      </nav>

      {activeInterestId && (
        <Suspense key={activeInterestId} fallback={<ArticleListSkeleton />}>
          <ArticleList
            userId={claimsData.claims.sub}
            interestId={activeInterestId}
          />
        </Suspense>
      )}
    </div>
  );
}

export default function FeedPage({
  searchParams,
}: {
  searchParams: Promise<{ interest?: string }>;
}) {
  return (
    <Suspense fallback={<FeedSkeleton />}>
      <FeedContent searchParams={searchParams} />
    </Suspense>
  );
}
