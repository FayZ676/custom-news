import { Article } from "@/lib/backend";

export function CardArticle({
  article,
  handleReadArticles = () => {},
}: {
  article: Article;
  handleReadArticles?: (articleIds: string[], isRead: boolean) => void;
}) {
  function handleChange() {
    if (article.is_read !== undefined && !article.is_read) {
      handleReadArticles([article.id], article.is_read);
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
    <div className="collapse border border-base-300">
      <input type="checkbox" onChange={handleChange} />
      <div className="collapse-title pr-4">
        <p className={`font-semibold ${article.is_read ? "line-through" : ""}`}>
          {article.title}
        </p>
        {article.summary && (
          <p className="truncate text-sm text-base-content/70">
            {article.summary}
          </p>
        )}
        <div className="flex justify-between mt-2 text-xs text-base-content/50">
          <span>{article.feed_title}</span>
          <span>{timeAgo(article.published_at)}</span>
        </div>
      </div>
      <div className="collapse-content text-sm text-base-content/70">
        <p>{article.content}</p>
        <a href={article.url} className="link">
          Read More
        </a>
      </div>
    </div>
  );
}
