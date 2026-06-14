import "server-only";

import { llmClient } from "@/lib/llm/client";
import {
  NewsQueryPayloadSchema,
  NEWSDATA_CATEGORIES,
  type NewsQueryPayload,
  type RefineAnswer,
} from "@/lib/interests/refine";

const SYSTEM_PROMPT = `You turn a user's news interest, plus their answers to a few refinement questions, into an optimized query for the News Data io API.

News Data io params you can set:
- q: full-text boolean query (supports AND, OR, NOT, "exact phrase")
- qInTitle: same syntax but only searches headlines (use sparingly, only when the user clearly wants headline matches)
- category: one of: ${NEWSDATA_CATEGORIES.join(", ")}
- country: ISO 3166-1 alpha-2 codes, comma-separated (e.g. "us,gb")
- timeframe: hours back as a number string (e.g. "24" = last 24 hours, "72" = last 3 days)

Goal: produce the query that best represents what the user actually wants — an optimized representation of their interest informed by their answers, NOT a literal restatement of those answers. Infer good search terms; drop noise. Use boolean operators and exact phrases to sharpen relevance.

Rules:
- Always return a non-empty q.
- Set qInTitle, category, country, and timeframe only when the answers clearly justify them; otherwise leave them null.
- Do not invent a country, category, or timeframe the user never implied.`;

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
    if (!payload.q?.trim()) {
      return { ...payload, q: interest };
    }
    return payload;
  } catch {
    return {
      q: interest,
      qInTitle: null,
      category: null,
      country: null,
      timeframe: null,
    };
  }
}
