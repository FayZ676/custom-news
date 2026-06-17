"use client";

import { useCallback, useState } from "react";

import { FeedArticle } from "@/lib/newsSearch";
import { timeAgo, toTitleCase } from "@/lib/utils";

import { SectionArticleSkeleton } from "@/components/SectionArticles";
import { NewsItemCard } from "@/components/NewsItemCard";

interface ViewFeedProps {
  articles: FeedArticle[];
  emptyStateMessage?: string;
  shareable?: boolean;
}

export function ViewFeed({
  articles,
  emptyStateMessage,
  shareable = true,
}: ViewFeedProps) {
  const [failedImageIds, setFailedImageIds] = useState<Set<string>>(new Set());

  const markImageFailed = useCallback((id: string) => {
    setFailedImageIds((prev) => new Set(prev).add(id));
  }, []);

  const hasRenderableImage = (article: FeedArticle) =>
    (article.image_url?.startsWith("https://") ?? false) &&
    !failedImageIds.has(article.id);

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
    <section className="flex flex-col gap-4">
      <ol className="flex flex-col gap-4">
        {Array.from({ length: count }).map((_, i) => (
          <li key={i}>
            <SectionArticleSkeleton />
          </li>
        ))}
      </ol>
    </section>
  );
}
