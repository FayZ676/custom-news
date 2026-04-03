"use client";

import { useRef, useState } from "react";

import { ChevronDown } from "lucide-react";

import { Article } from "@/lib/backend";

export function CardArticle({
  article,
  handleReadArticles = () => {},
}: {
  article: Article;
  handleReadArticles?: (articleIds: string[], isRead: boolean) => void;
}) {
  const pendingRead = useRef(false);
  const [isOpen, setIsOpen] = useState(false);

  function handleToggle() {
    if (isOpen && article.is_read !== undefined && !article.is_read) {
      pendingRead.current = true;
    }
    setIsOpen((prev) => !prev);
  }

  function handleTransitionEnd() {
    if (pendingRead.current) {
      setTimeout(() => {
        handleReadArticles([article.global_articles.id], article.is_read);
        pendingRead.current = false;
      }, 300);
    }
  }

  function timeAgo(dateStr: string): string {
    const seconds = Math.floor(
      (Date.now() - new Date(dateStr).getTime()) / 1000,
    );
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;
    const months = Math.floor(days / 30);
    if (months < 12) return `${months}mo ago`;
    return `${Math.floor(months / 12)}y ago`;
  }

  return (
    <div
      className="grid overflow-hidden rounded-box border border-base-300 transition-[grid-template-rows] duration-400"
      style={{
        gridTemplateRows: isOpen ? "max-content 1fr" : "max-content 0fr",
      }}
      onTransitionEnd={handleTransitionEnd}
    >
      {/* Header / toggle */}
      <button
        className="flex cursor-pointer items-center justify-between gap-2 px-4 py-3 text-left hover:bg-base-200"
        onClick={handleToggle}
      >
        <span className={"font-semibold text-base-content"}>
          {article.global_articles.title}
          <span className={"font-normal text-base-content/70"}>
            , {article.global_articles.feed_title} (
            {timeAgo(article.global_articles.published_at)})
          </span>
        </span>
        <ChevronDown
          className={`mt-0.5 size-4 shrink-0 text-base-content/70 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {/* Collapsible content */}
      <div className="min-h-0">
        <div className="flex flex-col gap-2 px-4 pb-4 pt-1">
          <p className="text-sm text-base-content/70">
            {article.global_articles.content
              ? article.global_articles.content
              : article.global_articles.summary || ""}
          </p>
          <a href={article.global_articles.url} className="link text-sm">
            Read More
          </a>
        </div>
      </div>
    </div>
  );
}

export function CardArticleSkeleton() {
  return (
    <div className="grid overflow-hidden rounded-box border border-base-300">
      <div className="flex items-center justify-between gap-2 px-4 py-3">
        <div className="skeleton h-5 w-3/4 rounded-lg" />
        <div className="skeleton size-4 shrink-0 rounded" />
      </div>
    </div>
  );
}
