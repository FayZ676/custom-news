"use client";

import { useRef } from "react";

import { GlobalArticle } from "@/lib/supabase/queries/global_articles";
import { timeAgo, toTitleCase } from "@/lib/utils";

import {
  NewsItemModal,
  NewsItemModalHandle,
  NewsItemArticle,
} from "@/components/NewsItemModal";
import { SectionArticleSkeleton } from "@/components/SectionArticles";
import { NewsItemCard } from "@/components/NewsItemCard";

interface ViewFeedProps {
  articles: GlobalArticle[];
}

export function ViewFeed({ articles }: ViewFeedProps) {
  const modalRef = useRef<NewsItemModalHandle>(null);

  function openModal(article: GlobalArticle) {
    const item: NewsItemArticle = {
      type: "article",
      id: article.id,
      title: article.title,
      summary: article.summary,
      url: article.url,
      feedTitle: article.feed_title,
      publishedAt: article.published_at,
      imageUrl: article.image_url,
    };
    modalRef.current?.open(item);
  }

  if (articles.length === 0) {
    return (
      <p className="text-sm italic text-neutral-500">
        No articles available right now.
      </p>
    );
  }

  const heroArticles = articles.slice(0, 1);
  const featuredArticles = articles.slice(1, 5);
  const compactArticles = articles.slice(5);

  return (
    <section className="flex flex-col">
      {heroArticles.length > 0 && (
        <ol className="flex flex-col gap-6 pb-6">
          {heroArticles.map((article) => (
            <NewsItemCard
              key={article.id}
              variant="hero"
              title={toTitleCase(article.title)}
              imageUrl={article.image_url}
              summary={article.summary}
              meta={`${timeAgo(article.published_at)} · ${article.feed_title}`}
              onClick={() => openModal(article)}
            />
          ))}
        </ol>
      )}

      {featuredArticles.length > 0 && (
        <>
          {heroArticles.length > 0 && (
            <hr className="border-t border-neutral-700 mb-6" />
          )}
          <ol className="flex flex-col gap-4 pb-6">
            {featuredArticles.map((article) => (
              <NewsItemCard
                key={article.id}
                variant="featured"
                title={toTitleCase(article.title)}
                imageUrl={article.image_url}
                summary={article.summary}
                meta={`${timeAgo(article.published_at)} · ${article.feed_title}`}
                onClick={() => openModal(article)}
              />
            ))}
          </ol>
        </>
      )}

      {compactArticles.length > 0 && (
        <>
          {(heroArticles.length > 0 || featuredArticles.length > 0) && (
            <hr className="border-t border-neutral-700 mb-4" />
          )}
          <ol className="flex flex-col gap-2">
            {compactArticles.map((article) => (
              <NewsItemCard
                key={article.id}
                variant="compact"
                title={toTitleCase(article.title)}
                imageUrl={article.image_url}
                summary={article.summary}
                meta={`${timeAgo(article.published_at)} · ${article.feed_title}`}
                onClick={() => openModal(article)}
              />
            ))}
          </ol>
        </>
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
