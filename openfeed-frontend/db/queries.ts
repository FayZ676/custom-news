import fs from "fs/promises";
import path from "path";
import { FeedArticle } from "./models";

/**
 * Prototype function to get articles from the fixtures JSON file.
 * In production, this would query a database.
 */
export async function getArticles(): Promise<FeedArticle[]> {
  try {
    // Path to the articles.json file in the backend fixtures
    const articlesPath = path.join(
      process.cwd(),
      "..",
      "openfeed-backend",
      "openfeed",
      "fixtures",
      "articles.json",
    );

    const fileContent = await fs.readFile(articlesPath, "utf-8");
    const articles: FeedArticle[] = JSON.parse(fileContent);

    return articles;
  } catch (error) {
    console.error("Error reading articles:", error);
    return [];
  }
}
