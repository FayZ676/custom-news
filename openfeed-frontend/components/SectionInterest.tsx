"use client";

import { startTransition, useOptimistic, useState } from "react";

import { EllipsisVertical } from "lucide-react";

import { toTitleCase } from "@/lib/utils";
import {
  InterestArticle,
  InterestArticles,
} from "@/lib/supabase/queries/global_articles";

import { SectionArticles } from "@/components/SectionArticles";

export interface SectionInterestProps {
  interest: InterestArticles;
  deleting: boolean;
  handleDeleteInterest: (interestId: string) => void;
  handleReadArticles: (articleIds: string[], isRead: boolean) => void;
}

export default function SectionInterest({
  interest,
  deleting,
  handleReadArticles,
  handleDeleteInterest,
}: SectionInterestProps) {
  const [showReadArticles, setShowReadArticles] = useState<boolean>(false);
  const [optimisticArticles, setOptimisticArticles] = useOptimistic(
    interest.articles,
    (
      current: InterestArticle[],
      { ids, isRead }: { ids: string[]; isRead: boolean },
    ) =>
      current.map((article) =>
        ids.includes(article.global_article.id)
          ? { ...article, is_read: isRead }
          : article,
      ),
  );

  const unreadArticles = optimisticArticles.filter(
    (article) => !article.is_read,
  );
  const readArticles = optimisticArticles.filter((article) => article.is_read);

  const handleToggleArticleReadOptimistic = async (
    articleIds: string[],
    isRead: boolean,
  ) => {
    startTransition(() => {
      setOptimisticArticles({ ids: articleIds, isRead });
    });
    await handleReadArticles(articleIds, isRead);
  };

  const handleMarkAllAsRead = async () => {
    const unreadIds = unreadArticles.map((a) => a.global_article.id);
    startTransition(() => {
      setOptimisticArticles({ ids: unreadIds, isRead: true });
    });
    await handleReadArticles(unreadIds, true);
  };

  return (
    <div className="flex flex-col gap-4 py-6 border-neutral-300 border-b">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl">{toTitleCase(interest.query)}</h1>
        <details className="dropdown dropdown-bottom dropdown-end">
          <summary
            role="button"
            className="btn btn-ghost m-1 rounded-none p-2 list-none"
          >
            <EllipsisVertical />
          </summary>
          <ul className="dropdown-content menu bg-base-100 rounded-none border z-1 w-52 p-2 shadow-sm">
            <li>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  (
                    e.currentTarget.closest("details") as HTMLDetailsElement
                  ).open = false;
                  setShowReadArticles(!showReadArticles);
                }}
                className="rounded-none"
              >
                {showReadArticles ? "Hide" : "Show"} Read Articles
              </button>
            </li>
            <li>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  (
                    e.currentTarget.closest("details") as HTMLDetailsElement
                  ).open = false;
                  handleMarkAllAsRead();
                }}
                className="rounded-none"
              >
                Mark all as Read
              </button>
            </li>
            <li>
              <button
                disabled={deleting}
                onClick={async (e) => {
                  e.preventDefault();
                  (
                    e.currentTarget.closest("details") as HTMLDetailsElement
                  ).open = false;
                  handleDeleteInterest(interest.id);
                }}
                className="rounded-none"
              >
                Delete Interest
              </button>
            </li>
          </ul>
        </details>
      </div>
      {unreadArticles.length > 0 ? (
        <SectionArticles
          articles={unreadArticles}
          handleReadArticle={handleToggleArticleReadOptimistic}
        />
      ) : (
        <p className="italic">All caught up</p>
      )}
      {showReadArticles && (
        <>
          <div className="flex items-center gap-2">
            <hr className="flex-1" />
            <span className="text-sm italic">Read Articles</span>
            <hr className="flex-1" />
          </div>
          <SectionArticles
            articles={readArticles}
            handleReadArticle={handleToggleArticleReadOptimistic}
          />
        </>
      )}
    </div>
  );
}
