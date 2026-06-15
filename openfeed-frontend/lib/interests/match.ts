import { parse, test } from "liqe";

import {
  normalizeNewsQueryPayload,
  type NewsQueryPayload,
} from "@/lib/interests/refine";

// ─── matchesQuery ─────────────────────────────────────────────────────────────
// The local-filter counterpart of payloadToParams: NewsData.io evaluates a
// NewsQueryPayload server-side, while RSS/Atom feeds (which aren't query-
// searchable) are filtered here against the SAME payload, so an interest means
// the same thing regardless of provider.
//
// liqe owns the boolean logic — AND / OR / NOT, parentheses, quoted phrases, and
// case-insensitive substring matching across the supplied fields. We only decide
// which fields each query sees (q -> title + summary, qInTitle -> title) and the
// timeframe recency bound. category / country have no meaning for a fixed feed.

export interface MatchableItem {
  title: string;
  summary: string | null;
  published_at?: string | null;
}

// Evaluate one query string against the given fields. A malformed query falls
// back to a plain substring check so a source never silently returns nothing.
function queryMatches(query: string, fields: Record<string, string>): boolean {
  try {
    return test(parse(query), fields);
  } catch {
    const haystack = Object.values(fields).join(" ").toLowerCase();
    return haystack.includes(query.trim().toLowerCase());
  }
}

function withinTimeframe(
  timeframe: string,
  publishedAt: string | null | undefined,
): boolean {
  if (!publishedAt) return false;
  const published = Date.parse(publishedAt);
  if (Number.isNaN(published)) return false;

  const minutesMatch = /^(\d+)m$/.exec(timeframe);
  const windowMs = minutesMatch
    ? Number(minutesMatch[1]) * 60_000
    : Number(timeframe) * 3_600_000;
  if (!Number.isFinite(windowMs) || windowMs <= 0) return true;

  return Date.now() - published <= windowMs;
}

export function matchesQuery(
  payload: NewsQueryPayload,
  item: MatchableItem,
): boolean {
  const normalized = normalizeNewsQueryPayload(payload);
  const title = item.title ?? "";
  const summary = item.summary ?? "";

  if (normalized.q && !queryMatches(normalized.q, { title, summary })) {
    return false;
  }
  if (normalized.qInTitle && !queryMatches(normalized.qInTitle, { title })) {
    return false;
  }
  if (
    normalized.timeframe &&
    !withinTimeframe(normalized.timeframe, item.published_at)
  ) {
    return false;
  }

  return true;
}
