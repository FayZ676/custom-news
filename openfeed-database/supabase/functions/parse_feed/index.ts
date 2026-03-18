import Parser from "npm:rss-parser";

// ─── Types ──────────────────────────────────────────────────

interface ArticleContent {
  type: string;
  base: string;
  value: string | null;
  language: string | null;
}

interface ParsedArticle {
  title: string;
  link: string;
  published: string;
  summary: string | null;
  description: string | null;
  content: ArticleContent[] | null;
}

/** Mirrors Python Article.__str__ — used downstream for embeddings */
export function articleToText(a: ParsedArticle): string {
  const parts: string[] = [a.title];
  if (a.description) parts.push(a.description);
  if (a.summary) parts.push(a.summary);
  if (a.content) {
    for (const c of a.content) {
      if (c.value) parts.push(c.value);
    }
  }
  return parts.join("\n\n");
}

// ─── Parsing ────────────────────────────────────────────────

const parser = new Parser({
  customFields: {
    item: [["content:encoded", "contentEncoded", { includeSnippet: true }]],
  },
});

// deno-lint-ignore no-explicit-any
function toContent(item: any, feedUrl: string): ArticleContent[] | null {
  const raw = item.contentEncodedSnippet ?? item.contentSnippet;
  if (!raw) return null;

  return [
    {
      type: item.contentEncoded ? "text/html" : "text/plain",
      base: feedUrl,
      value: raw || null,
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
    description: item.contentSnippet ?? null,
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

// ─── Handler ────────────────────────────────────────────────

Deno.serve(async (req) => {
  try {
    const { url } = await req.json();
    if (!url || typeof url !== "string") {
      return Response.json({ error: "Missing 'url'" }, { status: 400 });
    }

    const articles = await parseFeed(url);
    return Response.json(articles);
  } catch (e) {
    console.error("parse_feed error:", e);
    return Response.json({ error: (e as Error).message }, { status: 500 });
  }
});
