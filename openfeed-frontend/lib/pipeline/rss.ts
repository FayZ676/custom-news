import "server-only";

import { decode } from "he";
import { XMLParser } from "fast-xml-parser";

const REQUEST_TIMEOUT_MS = 15_000;
const SUMMARY_MAX_LENGTH = 1000;

export interface FeedSource {
  title: string;
  url: string;
}

export interface ParsedArticle {
  source_name: string;
  title: string;
  url: string;
  summary: string | null;
  image_url: string | null;
  published_at: string;
}

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
});

type XmlNode = Record<string, unknown>;

function asNodes(value: unknown): XmlNode[] {
  if (value === undefined || value === null) return [];
  return Array.isArray(value) ? value : [value as XmlNode];
}

function text(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number") return String(value);
  if (value && typeof value === "object" && "#text" in value) {
    return text((value as { "#text": unknown })["#text"]);
  }
  return "";
}

function cleanSummary(raw: string): string | null {
  const cleaned = decode(
    raw.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim(),
  )
    .replace(/\s*The post\b.*?\bappeared first on\b.*$/i, "")
    .trim();
  if (!cleaned) return null;
  if (cleaned.length <= SUMMARY_MAX_LENGTH) return cleaned;
  return cleaned.slice(0, SUMMARY_MAX_LENGTH).trimEnd() + "…";
}

function toIso(value: unknown): string | null {
  const parsed = Date.parse(text(value));
  return Number.isNaN(parsed) ? null : new Date(parsed).toISOString();
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
  return text(enclosure?.["@_url"]) || text(mediaUrl) || null;
}

function toArticle(item: XmlNode, sourceName: string): ParsedArticle | null {
  const title = decode(text(item.title));
  const url = pickLink(item.link) || text(item.id) || text(item.guid);
  const publishedAt = toIso(item.pubDate ?? item.published ?? item.updated);
  // Undated items can't be placed in the matching window, so skip them.
  if (!title || !url || !publishedAt) return null;

  const rawSummary =
    text(item.description) ||
    text(item.summary) ||
    text(item["content:encoded"]) ||
    text(item.content);

  return {
    source_name: sourceName,
    title,
    url,
    summary: rawSummary ? cleanSummary(rawSummary) : null,
    image_url: pickImage(item),
    published_at: publishedAt,
  };
}

function parseFeed(xml: string, sourceName: string): ParsedArticle[] {
  const parsed = parser.parse(xml) as XmlNode;
  const channel = (parsed.rss as XmlNode)?.channel as XmlNode | undefined;
  const feed = parsed.feed as XmlNode | undefined;
  // RSS 1.0 (RDF) puts items beside the channel rather than inside it.
  const rdf = parsed["rdf:RDF"] as XmlNode | undefined;

  const items = [
    ...asNodes(channel?.item),
    ...asNodes(feed?.entry),
    ...asNodes(rdf?.item),
  ];
  return items
    .map((item) => toArticle(item, sourceName))
    .filter((article): article is ParsedArticle => article !== null);
}

export async function fetchFeed(source: FeedSource): Promise<ParsedArticle[]> {
  const response = await fetch(source.url, {
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    headers: { "user-agent": "OpenFeed/1.0 (+rss)" },
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return parseFeed(await response.text(), source.title);
}
