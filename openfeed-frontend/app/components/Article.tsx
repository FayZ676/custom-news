import { FeedArticle } from "@/db/models";

interface ArticleProps {
  article: FeedArticle;
  index?: number;
}

export default function Article({ article, index = 0 }: ArticleProps) {
  return (
    <article
      key={`${article.link}-${index}`}
      className="border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow"
    >
      <h2 className="text-2xl font-semibold mb-2">
        <a
          href={article.link}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-800"
        >
          {article.title}
        </a>
      </h2>

      <p className="text-sm text-gray-500 mb-3">
        {new Date(article.published).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })}
      </p>

      {article.summary && (
        <p className="text-gray-700 mb-3">{article.summary}</p>
      )}

      {article.description && !article.summary && (
        <p className="text-gray-700 mb-3">{article.description}</p>
      )}

      {article.content && article.content.length > 0 && (
        <div className="text-gray-600 text-sm">
          {article.content[0].value?.substring(0, 200)}
          {article.content[0].value &&
            article.content[0].value.length > 200 &&
            "..."}
        </div>
      )}
    </article>
  );
}
