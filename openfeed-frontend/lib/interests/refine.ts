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
  effects: NewsQueryPayloadSchema,
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
};

// ─── synthesizeQueryPayload (pure, client-safe) ───────────────────────────────
// Reduces the user's answers into a final NewsQueryPayload.
// Multi-select within one question → OR-grouped in parens.
// Across questions → AND.
// Scalar fields (category, country, timeframe) → last-write wins.
// Always produces a non-empty q falling back to the raw interest string.

export function synthesizeQueryPayload(
  interest: string,
  history: RefineAnswer[],
): NewsQueryPayload {
  let qParts: string[] = [];
  let category: NewsQueryPayload["category"] = null;
  let country: string | null = null;
  let timeframe: string | null = null;
  let qInTitle: string | null = null;

  for (const answer of history) {
    const selected = answer.question.options.filter((o) =>
      answer.selectedOptionIds.includes(o.id),
    );
    const qTerms = selected
      .map((o) => o.effects.q)
      .filter((v): v is string => v !== null && v.trim().length > 0);

    if (qTerms.length === 1) {
      qParts.push(qTerms[0]);
    } else if (qTerms.length > 1) {
      qParts.push(`(${qTerms.join(" OR ")})`);
    }

    for (const opt of selected) {
      if (opt.effects.category !== null) category = opt.effects.category;
      if (opt.effects.country !== null) country = opt.effects.country;
      if (opt.effects.timeframe !== null) timeframe = opt.effects.timeframe;
      if (opt.effects.qInTitle !== null) qInTitle = opt.effects.qInTitle;
    }
  }

  const q = qParts.length > 0 ? qParts.join(" AND ") : interest;

  const payload: NewsQueryPayload = {
    q,
    qInTitle,
    category,
    country,
    timeframe,
  };

  // prune null-value fields so callers don't emit empty params
  return Object.fromEntries(
    Object.entries(payload).filter(([, v]) => v !== null && v !== ""),
  ) as NewsQueryPayload;
}

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
