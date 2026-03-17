export function ArticleCard({
  title,
  url,
  feedTitle,
  publishedAt,
  score,
}: {
  title: string;
  url: string;
  feedTitle: string;
  publishedAt: string;
  score: number;
}) {
  return (
    <div>
      <a href={url} target="_blank" rel="noopener noreferrer">
        {title}
      </a>
      <span>{feedTitle}</span>
      <span>{new Date(publishedAt).toLocaleDateString()}</span>
      <span>{(score * 100).toFixed(0)}% match</span>
    </div>
  );
}
