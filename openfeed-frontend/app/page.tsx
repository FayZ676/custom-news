import { getArticles } from "@/db/queries";
import SearchableArticleList from "@/app/components/SearchableArticleList";

export default async function Home() {
  const articles = await getArticles();

  return <SearchableArticleList initialArticles={articles} />;
}
