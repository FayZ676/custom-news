import { createClient } from "@/lib/supabase/server";
import { ArticleCard } from "@/components/ArticleCard";
import Link from "next/link";

export default async function FeedPage({
  searchParams,
}: {
  searchParams: Promise<{ interest?: string }>;
}) {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  if (!claimsData) return null;

  const userId = claimsData.claims.sub;
  const { interest: interestId } = await searchParams;

  const { data: interests } = await supabase
    .from("user_interests")
    .select("id, query")
    .eq("user_id", userId)
    .order("created_at");

  const activeInterestId = interestId ?? interests?.[0]?.id;

  const { data: articles } = activeInterestId
    ? await supabase
        .from("user_article_scores")
        .select(
          "score, global_articles(id, title, url, published_at, global_feeds(title))",
        )
        .eq("user_id", userId)
        .eq("interest_id", activeInterestId)
        .order("score", { ascending: false })
    : { data: null };

  return (
    <div>
      <nav>
        {interests?.map((interest) => (
          <Link key={interest.id} href={`/feed?interest=${interest.id}`}>
            {interest.query}
          </Link>
        ))}
      </nav>

      <div>
        {articles?.map(({ score, global_articles: article }) => {
          if (!article) return null;
          return (
            <ArticleCard
              key={article.id}
              title={article.title}
              url={article.url}
              feedTitle={article.global_feeds?.title ?? ""}
              publishedAt={article.published_at}
              score={score}
            />
          );
        })}
      </div>
    </div>
  );
}
