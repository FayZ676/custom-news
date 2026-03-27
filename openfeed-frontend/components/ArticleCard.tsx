"use client";

import { Tables } from "@/lib/supabase/supabase.types";

export function ArticleCard({
  article,
}: {
  article: Tables<"global_articles">;
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
    <div className="card card-border">
      <div className="card-body">
        <span className="card-title">{article.title}</span>
        {article.summary && (
          <p className="truncate font-semibold">{article.summary}</p>
        )}
        <div className="flex justify-between text-base-content/50">
          <span>{article.feed_title}</span>
          <span>{timeAgo(article.published_at)}</span>
        </div>
      </div>
      <div className="collapse-content text-sm">
        Click the "Sign Up" button in the top right corner and follow the
        registration process.
      </div>
    </div>
  );
}
