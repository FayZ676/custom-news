"use client";

import { useRef, useState } from "react";

import { timeAgo, toTitleCase } from "@/lib/utils";
import {
  QueryArticle,
  InterestArticle,
} from "@/lib/supabase/queries/global_stories";

import {
  NewsItemModal,
  NewsItemModalHandle,
  NewsItemArticle,
} from "@/components/NewsItemModal";
import { NewsItemCard } from "@/components/NewsItemCard";

interface SectionArticlesProps {
  articles: InterestArticle[] | QueryArticle[];
  handleReadArticle?: (articleIds: string[], isRead: boolean) => Promise<void>;
}

export function SectionArticles({
  articles,
  handleReadArticle,
}: SectionArticlesProps) {
  const modalRef = useRef<NewsItemModalHandle>(null);
  const [selectedArticle, setSelectedArticle] = useState<
    InterestArticle | QueryArticle | null
  >(null);

  function openModal(article: InterestArticle | QueryArticle) {
    setSelectedArticle(article);
    const item: NewsItemArticle = {
      type: "article",
      id: article.global_article.id,
      title: article.global_article.title,
      summary: article.global_article.summary,
      url: article.global_article.url,
      feedTitle: article.global_article.feed_title,
      publishedAt: article.global_article.published_at,
      imageUrl: article.global_article.image_url,
    };
    modalRef.current?.open(item);
  }

  function closeModal() {
    if (
      handleReadArticle &&
      selectedArticle &&
      "is_read" in selectedArticle &&
      !selectedArticle.is_read
    ) {
      handleReadArticle([selectedArticle.global_article.id], true);
    }
  }

  return (
    <>
      <ol className="flex flex-col gap-3 sm:gap-4">
        {articles.map((article) => {
          const isRead = "is_read" in article && article.is_read;
          return (
            <NewsItemCard
              key={article.global_article.id}
              variant="featured"
              title={toTitleCase(article.global_article.title)}
              imageUrl={article.global_article.image_url}
              summary={article.global_article.summary}
              meta={`${timeAgo(article.global_article.published_at)} · ${article.global_article.feed_title}`}
              isRead={isRead}
              onClick={() => openModal(article)}
            />
          );
        })}
      </ol>

      <NewsItemModal ref={modalRef} onClose={closeModal} />
    </>
  );
}

export function SectionArticleSkeleton() {
  return (
    <div className="grid overflow-hidden rounded-box border border-base-300">
      <div className="flex items-center justify-between gap-2 px-4 py-3">
        <div className="skeleton h-5 w-3/4 rounded-lg" />
        <div className="skeleton size-4 shrink-0 rounded" />
      </div>
    </div>
  );
}
