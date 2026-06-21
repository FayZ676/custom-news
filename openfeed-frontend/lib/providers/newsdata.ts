import "server-only";

import { z } from "zod";

import { fetchLatestNewsArticles } from "@/lib/newsSearch.server";
import { buildQueryFromClauses } from "@/lib/interests/queryClauses";
import type { Provider } from "@/lib/providers/types";

const API_KEY = process.env.NEWSDATA_API_KEY ?? "";

export const NEWSDATA_CATEGORIES = [
  "business",
  "crime",
  "domestic",
  "education",
  "entertainment",
  "environment",
  "food",
  "health",
  "lifestyle",
  "other",
  "politics",
  "science",
  "sports",
  "technology",
  "top",
  "tourism",
  "world",
] as const;

export const NEWSDATA_PRIORITY_DOMAINS = ["top", "medium", "low"] as const;

export const NewsQueryPayloadSchema = z.object({
  q: z.string().nullable(),
  qInTitle: z.string().nullable(),
  category: z.enum(NEWSDATA_CATEGORIES).nullable(),
  country: z.string().nullable(),
  timeframe: z.string().nullable(),
  all: z.array(z.string()).default([]),
  any: z.array(z.string()).default([]),
  sources: z.array(z.string()).default([]),
  prioritydomain: z.enum(NEWSDATA_PRIORITY_DOMAINS).nullable().default(null),
  imageOnly: z.boolean().default(false),
});

export type NewsQueryPayload = z.infer<typeof NewsQueryPayloadSchema>;

const DEFAULT_NEWS_QUERY_PAYLOAD: NewsQueryPayload = {
  q: null,
  qInTitle: null,
  category: null,
  country: null,
  timeframe: null,
  all: [],
  any: [],
  sources: [],
  prioritydomain: null,
  imageOnly: false,
};

export function createNewsQueryPayload(
  overrides: Partial<NewsQueryPayload> = {},
): NewsQueryPayload {
  return { ...DEFAULT_NEWS_QUERY_PAYLOAD, ...overrides };
}

// ─── normalizeNewsQueryPayload (pure) ─────────────────────────────────────────

const MAX_QUERY_LENGTH = 512;
const MAX_TIMEFRAME_HOURS = 48;
const MAX_TIMEFRAME_MINUTES = 2880;
const MAX_COUNTRIES = 5;

function cleanQueryString(value: string | null): string | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, MAX_QUERY_LENGTH);
}

function normalizeTimeframe(value: string | null): string | null {
  const trimmed = value?.trim().toLowerCase();
  if (!trimmed) return null;

  const minutesMatch = /^(\d+)m$/.exec(trimmed);
  if (minutesMatch) {
    const minutes = Number(minutesMatch[1]);
    if (minutes < 1) return null;
    return `${Math.min(minutes, MAX_TIMEFRAME_MINUTES)}m`;
  }

  const hoursMatch = /^(\d+)$/.exec(trimmed);
  if (hoursMatch) {
    const hours = Number(hoursMatch[1]);
    if (hours < 1) return null;
    return String(Math.min(hours, MAX_TIMEFRAME_HOURS));
  }

  return null;
}

function normalizeCountry(value: string | null): string | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  const codes = trimmed
    .split(",")
    .map((code) => code.trim().toLowerCase())
    .filter((code) => /^[a-z]{2}$/.test(code))
    .slice(0, MAX_COUNTRIES);
  return codes.length > 0 ? codes.join(",") : null;
}

export function normalizeNewsQueryPayload(
  payload: NewsQueryPayload,
): NewsQueryPayload {
  const all = payload.all ?? [];
  const any = payload.any ?? [];
  const clauseQ = buildQueryFromClauses(all, any);
  const q = cleanQueryString(payload.q ?? clauseQ);
  const qInTitle = cleanQueryString(payload.qInTitle);

  return {
    q,
    qInTitle: q ? null : qInTitle,
    category: payload.category,
    country: normalizeCountry(payload.country),
    timeframe: normalizeTimeframe(payload.timeframe),
    all,
    any,
    sources: payload.sources ?? [],
    prioritydomain: payload.prioritydomain,
    imageOnly: payload.imageOnly,
  };
}

// ─── payloadToParams (pure) ───────────────────────────────────────────────────

export type NewsQueryParams = Record<string, string>;

export function payloadToParams(
  payload: NewsQueryPayload,
  apiKey: string,
): NewsQueryParams {
  const normalized = normalizeNewsQueryPayload(payload);
  const params: NewsQueryParams = {
    apikey: apiKey,
    language: "en",
    removeduplicate: "1",
  };

  if (normalized.q) params.q = normalized.q;
  if (normalized.qInTitle) params.qInTitle = normalized.qInTitle;
  if (normalized.category) params.category = normalized.category;
  if (normalized.country) params.country = normalized.country;
  if (normalized.timeframe) params.timeframe = normalized.timeframe;
  if (normalized.prioritydomain)
    params.prioritydomain = normalized.prioritydomain;
  if (normalized.imageOnly) params.image = "1";

  return params;
}

export const newsDataProvider: Provider = {
  key: "newsdata",
  search(payload: NewsQueryPayload) {
    return fetchLatestNewsArticles(payloadToParams(payload, API_KEY));
  },
};
