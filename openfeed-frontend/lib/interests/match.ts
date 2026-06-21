import { parse, test } from "liqe";

import {
  normalizeNewsQueryPayload,
  type NewsQueryPayload,
} from "@/lib/providers/newsdata";

export interface MatchableItem {
  title: string;
  summary: string | null;
  published_at?: string | null;
}

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
