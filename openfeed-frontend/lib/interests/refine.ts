import { z } from "zod";

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

export const NewsQueryPayloadSchema = z.object({
  q: z.string().nullable(),
  qInTitle: z.string().nullable(),
  category: z.enum(NEWSDATA_CATEGORIES).nullable(),
  country: z.string().nullable(),
  timeframe: z.string().nullable(),
  all: z.array(z.string()).default([]),
  any: z.array(z.string()).default([]),
  sources: z.array(z.string()).default([]),
});

export type NewsQueryPayload = z.infer<typeof NewsQueryPayloadSchema>;

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

export function buildQueryFromClauses(all: string[], any: string[]): string | null {
  const allPart = all.length > 0 ? all.join(" AND ") : null;
  const anyPart = any.length > 0 ? (any.length === 1 ? any[0] : `(${any.join(" OR ")})`) : null;
  if (allPart && anyPart) return `${allPart} AND ${anyPart}`;
  return allPart ?? anyPart ?? null;
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
  };
}

// ─── payloadToParams (pure, client-safe) ──────────────────────────────────────

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

  return params;
}
