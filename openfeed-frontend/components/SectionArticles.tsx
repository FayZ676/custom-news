"use client";

import { useRef, useState } from "react";

import { timeAgo, toTitleCase } from "@/lib/utils";

import {
  QueryArticle,
  InterestArticle,
} from "@/lib/supabase/queries/global_articles";

import Modal from "@/components/Modal";

interface SectionArticlesProps {
  articles: InterestArticle[] | QueryArticle[];
  handleReadArticle?: (articleIds: string[], isRead: boolean) => Promise<void>;
}

export function SectionArticles({
  articles,
  handleReadArticle,
}: SectionArticlesProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [selectedArticle, setSelectedArticle] = useState<
    InterestArticle | QueryArticle | null
  >(null);

  function openModal(article: InterestArticle | QueryArticle) {
    setSelectedArticle(article);
    dialogRef.current?.showModal();
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
      <ol className="flex flex-col gap-4">
        {articles.map((article) => {
          const isRead = "is_read" in article && article.is_read;
          return (
            <li
              key={article.global_article.id}
              className={`flex flex-col gap-2 cursor-pointer ${isRead ? "opacity-50" : ""}`}
              onClick={() => openModal(article)}
            >
              <h2 className="text-xl hover:underline font-semibold">
                {toTitleCase(article.global_article.title)} &middot;{" "}
                <span className="text-neutral-500 text-base font-normal">
                  {timeAgo(article.global_article.published_at)} &middot;{" "}
                  {article.global_article.feed_title}
                </span>
              </h2>
            </li>
          );
        })}
      </ol>

      <Modal ref={dialogRef} onClose={closeModal}>
        {selectedArticle && (
          <div className="flex flex-col gap-4">
            <h3 className="text-xl font-semibold pr-6">
              {toTitleCase(selectedArticle.global_article.title)}
            </h3>
            <p className="text-sm text-neutral-500">
              {selectedArticle.global_article.feed_title} &middot;{" "}
              {timeAgo(selectedArticle.global_article.published_at)}
            </p>
            {selectedArticle.global_article.summary && (
              <p className="text-base leading-relaxed">
                {selectedArticle.global_article.summary}
              </p>
            )}
            <a
              href={selectedArticle.global_article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold underline"
            >
              Read full article →
            </a>
          </div>
        )}
      </Modal>
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
