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
  const [showScore, setShowScore] = useState(false);

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

  function matchLabel(score: number): { label: string; className: string } {
    if (score >= 0.7) return { label: "H", className: "text-green-400" };
    if (score >= 0.4) return { label: "M", className: "text-yellow-400" };
    return { label: "L", className: "text-red-400" };
  }

  const { label, className } = matchLabel(score);

  return (
    <div className="relative w-full min-w-0 p-4 border border-gray-800">
      <a
        href={article.url}
        target="_blank"
        rel="noopener noreferrer"
        className="absolute inset-0"
        aria-label={article.title}
      />
      <div className="flex items-start justify-between gap-4">
        <span className="min-w-0 wrap-break-word">{article.title}</span>
        <button
          onClick={() => setShowScore((prev) => !prev)}
          className={`relative shrink-0 text-sm font-medium cursor-pointer ${className}`}
        >
          {showScore ? `${(score * 100).toFixed(0)}%` : label}
        </button>
      </div>
      {article.summary && <p className="truncate">{article.summary}</p>}
      <span>{timeAgo(article.published_at)}</span>
    </div>
  );
}
