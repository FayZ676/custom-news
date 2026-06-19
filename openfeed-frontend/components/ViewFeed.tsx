"use client";

import { useCallback, useState } from "react";

import { FeedArticle } from "@/lib/newsSearch";
import { timeAgo, toTitleCase } from "@/lib/utils";

import { NewsItemCard, NewsItemCardSkeleton } from "@/components/NewsItemCard";

interface ViewFeedProps {
  articles: (FeedArticle & { interest_id?: string | null })[];
  emptyStateMessage?: string;
  shareable?: boolean;
  /** Maps an interest id to its label, used to tag each card with the
   * interest it was matched against. Search results have no interest, so
   * leaving this undefined simply omits the tag. */
  interestNameById?: Map<string, string>;
}

export function ViewFeed({
  articles,
  emptyStateMessage,
  shareable = true,
  interestNameById,
}: ViewFeedProps) {
  const [failedImageIds, setFailedImageIds] = useState<Set<string>>(new Set());

  const markImageFailed = useCallback((id: string) => {
    setFailedImageIds((prev) => new Set(prev).add(id));
  }, []);

  const hasRenderableImage = (article: FeedArticle) =>
    (article.image_url?.startsWith("https://") ?? false) &&
    !failedImageIds.has(article.id);

  const interestLabelFor = (article: { interest_id?: string | null }) =>
    article.interest_id
      ? (interestNameById?.get(article.interest_id) ?? null)
      : null;

  const articlesWithImages = articles
    .filter(hasRenderableImage)
    .sort((a, b) => (a.summary ? 0 : 1) - (b.summary ? 0 : 1));
  const articlesWithoutImages = articles
    .filter((article) => !hasRenderableImage(article))
    .sort((a, b) => (a.summary ? 0 : 1) - (b.summary ? 0 : 1));

  if (articles.length === 0) {
    return (
      <p className="text-subtle italic py-4">
        {emptyStateMessage ?? "No articles available right now."}
      </p>
    );
  }

  return (
    <section className="flex flex-col">
      {articlesWithImages.length > 0 && (
        <ol className="flex flex-col">
          {articlesWithImages.map((article) => (
            <NewsItemCard
              key={article.id}
              title={toTitleCase(article.title)}
              imageUrl={article.image_url}
              summary={article.summary}
              meta={`${timeAgo(article.published_at)} · ${article.source_name}`}
              interestLabel={interestLabelFor(article)}
              href={shareable ? `/feed/article/${article.id}` : article.url}
              external={!shareable}
              onImageError={() => markImageFailed(article.id)}
            />
          ))}
        </ol>
      )}
      {articlesWithoutImages.length > 0 && (
        <ol className="flex flex-col">
          {articlesWithoutImages.map((article) => (
            <NewsItemCard
              key={article.id}
              title={toTitleCase(article.title)}
              imageUrl={article.image_url}
              summary={article.summary}
              meta={`${timeAgo(article.published_at)} · ${article.source_name}`}
              interestLabel={interestLabelFor(article)}
              href={shareable ? `/feed/article/${article.id}` : article.url}
              external={!shareable}
            />
          ))}
        </ol>
      )}
    </section>
  );
}

export function ViewFeedSkeleton({ count = 5 }: { count?: number }) {
  return (
    <section className="flex flex-col">
      <ol className="flex flex-col">
        {Array.from({ length: count }).map((_, i) => (
          <NewsItemCardSkeleton key={i} />
        ))}
      </ol>
    </section>
  );
}
