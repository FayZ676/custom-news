// @ts-nocheck

import Parser from "npm:rss-parser";
import { DOMParser } from "jsr:@b-fuze/deno-dom";

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

// ─── HTML cleanup ───────────────────────────────────────────

const domParser = new DOMParser();

function stripHtml(html: string): string {
  const doc = domParser.parseFromString(html, "text/html");
  return (doc?.body?.textContent ?? "").trim();
}

// ─── Parsing ────────────────────────────────────────────────

const parser = new Parser({
  customFields: {
    item: [["content:encoded", "contentEncoded"]],
  },
});

// deno-lint-ignore no-explicit-any
function toSummary(item: any): string | null {
  if (item.summary) return stripHtml(item.summary);
  return item.contentSnippet ?? null;
}

// deno-lint-ignore no-explicit-any
function toContent(item: any, feedUrl: string): ArticleContent[] | null {
  // Only use content:encoded (full body) or Atom <content> when distinct from <description>
  const html = item.contentEncoded ?? null;
  // For Atom feeds, item.content comes from <content> (full body), use it
  // For RSS feeds, item.content comes from <description> (same as summary), skip it
  const body = html ?? (item.summary ? item.content : null);
  if (!body) return null;
  return [
    {
      type: "text/plain",
      base: feedUrl,
      value: stripHtml(body),
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
    summary: toSummary(item),
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
