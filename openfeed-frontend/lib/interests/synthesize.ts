import "server-only";

import { llmClient } from "@/lib/llm/client";
import {
  NewsQueryPayloadSchema,
  NEWSDATA_CATEGORIES,
  normalizeNewsQueryPayload,
  type NewsQueryPayload,
  type RefineAnswer,
} from "@/lib/interests/refine";

const SYSTEM_PROMPT = `You turn a user's news interest, plus their answers to a few refinement questions, into an optimized query for the NewsData.io API.

NewsData.io params you can set:
- q: full-text boolean query.
- qInTitle: same syntax but only searches headlines.
- category: one of: ${NEWSDATA_CATEGORIES.join(", ")}
- country: ISO 3166-1 alpha-2 codes, comma-separated, up to 5 (e.g. "us,gb").
- timeframe: recency window. Either a number of hours (1–48, e.g. "24") or minutes with an "m" suffix (1–2880, e.g. "30m").

Goal: produce the query that best represents what the user actually wants — an optimized representation of their interest informed by their answers, NOT a literal restatement of those answers. Infer good search terms; drop noise.

Building an effective q / qInTitle string:
- Broaden recall by OR-ing synonyms and related entities, e.g. ("electric vehicles" OR EV OR Tesla).
- Use "exact phrases" in quotes for multi-word names and concepts.
- Use AND sparingly to combine distinct required concepts; too many ANDs returns zero results.
- Use NOT to exclude noise the user clearly doesn't want.
- Keep the whole query string under 512 characters.

Rules:
- Set EXACTLY ONE of q or qInTitle — they are mutually exclusive and cannot be combined. Default to q. Use qInTitle only when the user clearly wants headline-only matches, and in that case leave q null.
- Set category, country, and timeframe only when the answers clearly justify them; otherwise leave them null.
- Do not invent a country, category, or timeframe the user never implied.

Example:
Interest: "electric cars"
Answers: Q: Which angle? A: New model launches; Q: Region? A: United States
Payload: { q: "(\\"electric vehicle\\" OR EV) AND (launch OR \\"new model\\")", qInTitle: null, category: "technology", country: "us", timeframe: null }`;

function buildUserPrompt(interest: string, history: RefineAnswer[]): string {
  if (history.length === 0) {
    return `Interest: "${interest}"\n\nThe user did not answer any refinement questions. Build the best query from the interest alone.`;
  }

  const historyText = history
    .map((a) => {
      const parts = a.question.options
        .filter((o) => a.selectedOptionIds.includes(o.id))
        .map((o) => o.label);
      if (a.freeText?.trim()) parts.push(a.freeText.trim());
      const answer = parts.length > 0 ? parts.join(", ") : "(no preference)";
      return `Q: ${a.question.prompt}\nA: ${answer}`;
    })
    .join("\n\n");

  return `Interest: "${interest}"\n\nAnswers:\n${historyText}\n\nBuild the optimized query.`;
}

export async function synthesizeQuery(
  interest: string,
  history: RefineAnswer[],
): Promise<NewsQueryPayload> {
  try {
    const payload = await llmClient.completeStructured({
      schema: NewsQueryPayloadSchema,
      schemaName: "news_query_payload",
      system: SYSTEM_PROMPT,
      user: buildUserPrompt(interest, history),
    });
    const normalized = normalizeNewsQueryPayload(payload);
    // Backfill q only when the model produced no usable search field at all,
    // so a deliberate qInTitle-only query is preserved.
    if (!normalized.q && !normalized.qInTitle) {
      return { ...normalized, q: interest };
    }
    return normalized;
  } catch {
    return normalizeNewsQueryPayload({
      q: interest,
      qInTitle: null,
      category: null,
      country: null,
      timeframe: null,
    });
  }
}
