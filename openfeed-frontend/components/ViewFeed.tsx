"use client";

import { useRef } from "react";

import { UserArticle } from "@/lib/supabase/queries/user_articles";
import { timeAgo, toTitleCase } from "@/lib/utils";

import {
  NewsItemModal,
  NewsItemModalHandle,
  NewsItemArticle,
} from "@/components/NewsItemModal";
import { SectionArticleSkeleton } from "@/components/SectionArticles";
import { NewsItemCard } from "@/components/NewsItemCard";

interface ViewFeedProps {
  articles: UserArticle[];
  emptyStateMessage?: string;
}

export function ViewFeed({ articles, emptyStateMessage }: ViewFeedProps) {
  const modalRef = useRef<NewsItemModalHandle>(null);
  const hasRenderableImage = (imageUrl?: string | null) =>
    imageUrl?.startsWith("https://") ?? false;
  const articlesWithImages = articles.filter((article) =>
    hasRenderableImage(article.image_url),
  );
  const articlesWithoutImages = articles
    .filter((article) => !hasRenderableImage(article.image_url))
    .sort((a, b) => (a.summary ? 0 : 1) - (b.summary ? 0 : 1));

  function openModal(article: UserArticle) {
    const item: NewsItemArticle = {
      type: "article",
      id: article.id,
      title: article.title,
      summary: article.summary,
      url: article.url,
      sourceName: article.source_name,
      publishedAt: article.published_at,
      imageUrl: article.image_url,
    };
    modalRef.current?.open(item);
  }

  if (articles.length === 0) {
    return (
      <p className="text-subtle italic">
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
              onClick={() => openModal(article)}
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
              onClick={() => openModal(article)}
            />
          ))}
        </ol>
      )}

      <NewsItemModal ref={modalRef} />
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
