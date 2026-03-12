import { getArticles } from "@/db/queries";
import Article from "./components/Article";

export default async function Home() {
  const articles = await getArticles();

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8">OpenFeed Frontend</h1>

      <div className="space-y-6">
        {articles.length === 0 ? (
          <p className="text-gray-500">No articles found.</p>
        ) : (
          articles.map((article, index) => (
            <Article
              key={`${article.link}-${index}`}
              article={article}
              index={index}
            />
          ))
        )}
      </div>

      {/* TODO: Allow searching by a query (i.e. call the /rank endpoint) */}
    </div>
  );
}
