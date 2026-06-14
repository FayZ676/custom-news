import { z } from "zod";

// ─── Zod schemas (source of truth) ───────────────────────────────────────────
// Strict Structured Outputs requires: root is object, all fields required,
// additionalProperties:false, optional fields as .nullable() not .optional().

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
});

export const RefinementOptionSchema = z.object({
  id: z.string(),
  label: z.string(),
});

export const RefinementQuestionSchema = z.object({
  id: z.string(),
  prompt: z.string(),
  multiSelect: z.boolean(),
  options: z.array(RefinementOptionSchema),
});

export const NextQuestionResultSchema = z.object({
  done: z.boolean(),
  question: RefinementQuestionSchema.nullable(),
});

export type NewsQueryPayload = z.infer<typeof NewsQueryPayloadSchema>;
export type RefinementOption = z.infer<typeof RefinementOptionSchema>;
export type RefinementQuestion = z.infer<typeof RefinementQuestionSchema>;
export type NextQuestionResult = z.infer<typeof NextQuestionResultSchema>;

export type RefineAnswer = {
  question: RefinementQuestion;
  selectedOptionIds: string[];
  freeText?: string;
};

// ─── normalizeNewsQueryPayload (pure) ─────────────────────────────────────────
// Enforces NewsData.io constraints regardless of where the payload came from
// (LLM output or stored Supabase payloads), so we never build an invalid query:
// - q / qInTitle / qInMeta are mutually exclusive — only one allowed per request.
// - each query string maxes at 512 characters.
// - timeframe is 1–48 hours, or 1–2880 minutes ("<n>m").
// - country allows up to 5 comma-separated ISO 3166-1 alpha-2 codes.

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
  const q = cleanQueryString(payload.q);
  const qInTitle = cleanQueryString(payload.qInTitle);

  return {
    // Mutual exclusivity: keep q when both are set (q is the primary field).
    q,
    qInTitle: q ? null : qInTitle,
    category: payload.category,
    country: normalizeCountry(payload.country),
    timeframe: normalizeTimeframe(payload.timeframe),
  };
}

// ─── payloadToParams (pure, client-safe) ──────────────────────────────────────
// Converts a NewsQueryPayload to URLSearchParams-ready key/value pairs.
// Callers must inject apikey; this layer handles the structural mapping.

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
