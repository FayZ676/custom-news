// @ts-nocheck

import Parser from "npm:rss-parser";

// ─── Types ──────────────────────────────────────────────────

export interface ArticleContent {
  type: string;
  base: string;
  value: string | null;
  language: string | null;
}

export interface ParsedArticle {
  title: string;
  link: string;
  published: string;
  summary: string | null;
  content: ArticleContent[] | null;
}

// ─── Parsing ────────────────────────────────────────────────

const parser = new Parser({
  customFields: {
    item: [["content:encoded", "contentEncoded", { includeSnippet: true }]],
  },
});

// deno-lint-ignore no-explicit-any
function toContent(item: any, feedUrl: string): ArticleContent[] | null {
  if (!item.contentEncodedSnippet) return null;
  return [
    {
      type: "text/plain",
      base: feedUrl,
      value: item.contentEncodedSnippet,
      language: null,
    },
  ];
}

// deno-lint-ignore no-explicit-any
function toArticle(item: any, feedUrl: string): ParsedArticle {
  if (!item.title) throw new Error("Missing title");
  if (!item.link) throw new Error("Missing link");
  if (!item.isoDate) throw new Error("Missing date");
  return {
    title: item.title,
    link: item.link,
    published: item.isoDate,
    summary: item.contentSnippet ?? null,
    content: toContent(item, feedUrl),
  };
}

// deno-lint-ignore no-explicit-any
function getArticles(items: any[], feedUrl: string): ParsedArticle[] {
  const articles: ParsedArticle[] = [];
  for (const item of items) {
    try {
      articles.push(toArticle(item, feedUrl));
    } catch (e) {
      console.error(e);
      console.error(
        `FAILED TO PARSE ARTICLE:\n${JSON.stringify(item).slice(0, 500)}`,
      );
    }
  }
  return articles;
}

/** Full parse pipeline — fetch feed XML, return parsed articles */
export async function parseFeed(url: string): Promise<ParsedArticle[]> {
  const feed = await parser.parseURL(url);
  return getArticles(feed.items, url);
}
