"use client";

import { useState } from "react";

export function ArticleCard({
  article,
  score,
}: {
  article: {
    id: string;
    title: string;
    url: string;
    published_at: string;
    summary: string | null;
    global_feeds: { title: string } | null;
  };
  score: number;
}) {
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
    <div className="flex flex-col gap-2 w-full min-w-0 p-4 border border-base-300 rounded-lg">
      <a
        href={article.url}
        target="_blank"
        rel="noopener noreferrer"
        className="absolute inset-0"
        aria-label={article.title}
      />
      <span className="text-xl font-semibold min-w-0 wrap-break-word">
        {article.title}
      </span>
      {article.summary && (
        <p className="truncate font-semibold">{article.summary}</p>
      )}
      <div className="flex justify-between text-base-content/50">
        <span>
          {article.global_feeds?.title && `${article.global_feeds.title}`}
        </span>
        <span>{timeAgo(article.published_at)}</span>
      </div>
    </div>
  );
}
