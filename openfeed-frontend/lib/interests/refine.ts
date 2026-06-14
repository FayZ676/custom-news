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

// ─── payloadToParams (pure, client-safe) ──────────────────────────────────────
// Converts a NewsQueryPayload to URLSearchParams-ready key/value pairs.
// Callers must inject apikey; this layer handles the structural mapping.

export type NewsQueryParams = Record<string, string>;

export function payloadToParams(
  payload: NewsQueryPayload,
  apiKey: string,
): NewsQueryParams {
  const params: NewsQueryParams = {
    apikey: apiKey,
    language: "en",
    removeduplicate: "1",
  };

  if (payload.q?.trim()) params.q = payload.q.trim();
  if (payload.qInTitle?.trim()) params.qInTitle = payload.qInTitle.trim();
  if (payload.category) params.category = payload.category;
  if (payload.country?.trim()) params.country = payload.country.trim();
  if (payload.timeframe?.trim()) params.timeframe = payload.timeframe.trim();

  return params;
}
