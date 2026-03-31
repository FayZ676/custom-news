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
      handleReadArticles([article.global_articles.id], article.is_read);
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
    <div className="collapse collapse-arrow border border-base-300">
      <input type="checkbox" onChange={handleChange} />
      <span
        className={`collapse-title font-semibold ${article.is_read ? "line-through" : ""}`}
      >
        {article.global_articles.title}
        <span className="font-normal text-base-content/70">
          , {article.global_articles.feed_title} (
          {timeAgo(article.global_articles.published_at)})
        </span>
      </span>
      <div className="collapse-content flex flex-col gap-2">
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
  );
}
