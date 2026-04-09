"use client";

import { timeAgo, toTitleCase } from "@/lib/utils";

import {
  QueryArticle,
  InterestArticle,
} from "@/lib/supabase/queries/global_articles";

interface SectionArticlesProps {
  articles: InterestArticle[] | QueryArticle[];
  handleReadArticle?: (articleIds: string[], isRead: boolean) => Promise<void>;
}

export function SectionArticles({
  articles,
  handleReadArticle,
}: SectionArticlesProps) {
  return (
    <ol className="flex flex-col gap-6">
      {articles.map((article) => {
        return (
          <li key={article.global_article.id} className="flex flex-col gap-2">
            <h2 className="text-3xl hover:underline">
              <a href={article.global_article.url}>
                {toTitleCase(article.global_article.title)}
              </a>
            </h2>
            <p className="line-clamp-3">
              {article.global_article.summary
                ? article.global_article.summary
                : article.global_article.content}
            </p>
            <div className="flex justify-between text-sm">
              <div className="italic">
                <span>{article.global_article.feed_title}</span>
                {", "}
                <span>{timeAgo(article.global_article.published_at)}</span>
              </div>
              {handleReadArticle && "is_read" in article && (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    handleReadArticle(
                      [article.global_article.id],
                      article.is_read,
                    );
                  }}
                  className="italic underline cursor-pointer"
                >
                  {article.is_read ? "Mark as Unread" : "Mark as Read"}
                </button>
              )}
            </div>
          </li>
        );
      })}
    </ol>
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
