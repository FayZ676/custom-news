"use client";

import { useState } from "react";
import { FeedArticle, FeedArticleRanked } from "@/db/models";
import { rankArticles } from "@/app/api/openfeed-backend/route";
import Article from "@/app/components/Article";

export default function SearchableArticleList({
  initialArticles,
}: {
  initialArticles: FeedArticle[];
}) {
  const [query, setQuery] = useState("");
  const [articles, setArticles] =
    useState<(FeedArticle | FeedArticleRanked)[]>(initialArticles);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!query.trim()) {
      // If query is empty, show original articles
      setArticles(initialArticles);
      return;
    }

    setIsSearching(true);
    setError(null);

    try {
      const ranked = await rankArticles(query, initialArticles);
      setArticles(ranked);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to search articles",
      );
      setArticles(initialArticles);
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const getArticle = (item: FeedArticle | FeedArticleRanked): FeedArticle => {
    return "article" in item ? item.article : item;
  };

  const getScore = (
    item: FeedArticle | FeedArticleRanked,
  ): number | undefined => {
    return "score" in item ? item.score : undefined;
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8">OpenFeed Frontend</h1>

      {/* Search Bar */}
      <div className="mb-8">
        <div className="relative flex gap-2">
          <input
            type="text"
            placeholder="Search articles by topic or keywords..."
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isSearching}
          />
          <button
            onClick={handleSearch}
            disabled={isSearching}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {isSearching ? "Searching..." : "Search"}
          </button>
        </div>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        {query && !isSearching && articles.length > 0 && (
          <p className="mt-2 text-sm text-gray-600">
            Found {articles.length} articles matching "{query}"
          </p>
        )}
      </div>

      {/* Articles List */}
      <div className="space-y-6">
        {articles.length === 0 ? (
          <p className="text-gray-500">No articles found.</p>
        ) : (
          articles.map((item, index) => {
            const article = getArticle(item);
            const score = getScore(item);

            return (
              <div key={`${article.link}-${index}`} className="relative">
                <Article article={article} index={index} />
                {score !== undefined && (
                  <div className="absolute top-2 right-2 bg-blue-500 text-white px-3 py-1 rounded-full text-sm">
                    Score: {score.toFixed(3)}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
