import "server-only";

import he from "he";
import { XMLParser } from "fast-xml-parser";

import type { FeedArticle } from "@/lib/newsSearch";
import { matchesQuery } from "@/lib/interests/match";
import type { NewsQueryPayload } from "@/lib/interests/refine";
import type { FeedDefinition, Provider } from "@/lib/providers/types";

const REQUEST_TIMEOUT_MS = 30_000;

export type FeedCache = Map<string, Promise<FeedArticle[]>>;

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
});

type XmlNode = Record<string, unknown>;

function asArray<T>(value: T | T[] | undefined | null): T[] {
  if (value === undefined || value === null) return [];
  return Array.isArray(value) ? value : [value];
}

function asNodes(value: unknown): XmlNode[] {
  return asArray(value as XmlNode | XmlNode[] | undefined);
}

function cleanSummary(raw: string): string {
  const decoded = he.decode(
    raw.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim(),
  );
  return decoded.replace(/\s*The post\b.*?\bappeared first on\b.*$/i, "").trim();
}

function text(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number") return String(value);
  if (value && typeof value === "object" && "#text" in value) {
    return text((value as { "#text": unknown })["#text"]);
  }
  return "";
}

function toIso(value: unknown): string {
  const raw = text(value);
  const parsed = raw ? Date.parse(raw) : NaN;
  return Number.isNaN(parsed)
    ? new Date().toISOString()
    : new Date(parsed).toISOString();
}

function pickLink(link: unknown): string {
  if (typeof link === "string") return link.trim();
  const links = asNodes(link);
  const alternate = links.find((l) => l["@_rel"] === "alternate") ?? links[0];
  if (!alternate) return "";
  return text(alternate["@_href"] ?? alternate["#text"]);
}

function pickImage(item: XmlNode): string | null {
  const enclosure = asNodes(item.enclosure).find((e) =>
    text(e["@_type"]).startsWith("image"),
  );
  const media = item["media:content"] ?? item["media:thumbnail"];
  const mediaUrl = asNodes(media)[0]?.["@_url"];
  const url = text(enclosure?.["@_url"]) || text(mediaUrl);
  return url || null;
}

function itemToFeedArticle(
  item: XmlNode,
  sourceName: string,
  sourceKey: string,
): FeedArticle | null {
  const title = text(item.title);
  const url = pickLink(item.link) || text(item.id) || text(item.guid);
  if (!title || !url) return null;

  const rawSummary =
    text(item.description) ||
    text(item.summary) ||
    text(item["content:encoded"]) ||
    text(item.content);
  const summary = rawSummary ? cleanSummary(rawSummary) : "";

  return {
    id: url,
    title,
    summary: summary || null,
    url,
    source_name: sourceName,
    source_key: sourceKey,
    published_at: toIso(item.pubDate ?? item.published ?? item.updated),
    image_url: pickImage(item),
  };
}

function parseFeed(xml: string, sourceName: string, sourceKey: string): FeedArticle[] {
  const parsed = parser.parse(xml) as XmlNode;
  const channel = (parsed.rss as XmlNode)?.channel as XmlNode | undefined;
  const feed = parsed.feed as XmlNode | undefined;

  const rssItems = asNodes(channel?.item);
  const items = rssItems.length > 0 ? rssItems : asNodes(feed?.entry);

  return items
    .map((item) => itemToFeedArticle(item, sourceName, sourceKey))
    .filter((article): article is FeedArticle => article !== null);
}

export function fetchFeedOnce(
  def: FeedDefinition,
  cache: FeedCache,
): Promise<FeedArticle[]> {
  const cached = cache.get(def.feedUrl);
  if (cached) return cached;

  const promise = (async () => {
    try {
      const response = await fetch(def.feedUrl, {
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        headers: { "user-agent": "OpenFeed/1.0 (+rss)" },
      });
      if (!response.ok) return [];
      const xml = await response.text();
      return parseFeed(xml, def.label, def.key);
    } catch {
      return [];
    }
  })();

  cache.set(def.feedUrl, promise);
  return promise;
}

export function createRssProvider(
  def: FeedDefinition,
  cache: FeedCache,
): Provider {
  return {
    key: def.key,
    async search(payload: NewsQueryPayload) {
      const articles = await fetchFeedOnce(def, cache);
      return articles.filter((article) => matchesQuery(payload, article));
    },
  };
}
