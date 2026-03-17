import { getUserInterests, getArticlesForInterest } from "@/actions/articles";
import { ArticleCard } from "@/components/ArticleCard";
import Link from "next/link";

export default async function FeedPage({
  searchParams,
}: {
  searchParams: Promise<{ interest?: string }>;
}) {
  const interests = await getUserInterests();
  const { interest: interestId } = await searchParams;

  const activeInterestId = interestId ?? interests?.[0]?.id;

  const articles = activeInterestId
    ? await getArticlesForInterest(activeInterestId)
    : null;

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
