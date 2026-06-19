"use client";

import { useCallback, useState } from "react";

import { FeedArticle } from "@/lib/newsSearch";
import { timeAgo, toTitleCase } from "@/lib/utils";

import { NewsItemCard, NewsItemCardSkeleton } from "@/components/NewsItemCard";

interface ViewFeedProps {
  articles: FeedArticle[];
  emptyStateMessage?: string;
  shareable?: boolean;
  readIds?: Set<string>;
  newIds?: Set<string>;
}

const EMPTY_IDS: Set<string> = new Set();

export function ViewFeed({
  articles,
  emptyStateMessage,
  shareable = true,
  readIds = EMPTY_IDS,
  newIds = EMPTY_IDS,
}: ViewFeedProps) {
  const [failedImageIds, setFailedImageIds] = useState<Set<string>>(new Set());

  const markImageFailed = useCallback((id: string) => {
    setFailedImageIds((prev) => new Set(prev).add(id));
  }, []);

  const hasRenderableImage = (article: FeedArticle) =>
    (article.image_url?.startsWith("https://") ?? false) &&
    !failedImageIds.has(article.id);

  // Render one status group, keeping the existing image / non-image split and
  // recency-by-summary ordering within it.
  const renderGroup = (group: FeedArticle[]) => {
    const withImages = group
      .filter(hasRenderableImage)
      .sort((a, b) => (a.summary ? 0 : 1) - (b.summary ? 0 : 1));
    const withoutImages = group
      .filter((article) => !hasRenderableImage(article))
      .sort((a, b) => (a.summary ? 0 : 1) - (b.summary ? 0 : 1));

    const card = (article: FeedArticle, withImageHandler: boolean) => (
      <NewsItemCard
        key={article.id}
        title={toTitleCase(article.title)}
        imageUrl={article.image_url}
        summary={article.summary}
        meta={`${timeAgo(article.published_at)} · ${article.source_name}`}
        href={shareable ? `/feed/article/${article.id}` : article.url}
        external={!shareable}
        isRead={readIds.has(article.id)}
        isNew={newIds.has(article.id)}
        onImageError={withImageHandler ? () => markImageFailed(article.id) : undefined}
      />
    );

    return (
      <>
        {withImages.length > 0 && (
          <ol className="flex flex-col">
            {withImages.map((article) => card(article, true))}
          </ol>
        )}
        {withoutImages.length > 0 && (
          <ol className="flex flex-col">
            {withoutImages.map((article) => card(article, false))}
          </ol>
        )}
      </>
    );
  };

  if (articles.length === 0) {
    return (
      <p className="text-subtle italic py-4">
        {emptyStateMessage ?? "No articles available right now."}
      </p>
    );
  }

  // Outer grouping: new-unread, then other unread, then read. Within each group
  // the existing recency order is preserved. The split is computed per server
  // load, so tapping a card (which navigates away) never reorders mid-scroll.
  const newGroup: FeedArticle[] = [];
  const unreadGroup: FeedArticle[] = [];
  const readGroup: FeedArticle[] = [];
  for (const article of articles) {
    if (readIds.has(article.id)) readGroup.push(article);
    else if (newIds.has(article.id)) newGroup.push(article);
    else unreadGroup.push(article);
  }

  return (
    <section className="flex flex-col">
      {renderGroup(newGroup)}
      {renderGroup(unreadGroup)}
      {renderGroup(readGroup)}
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
