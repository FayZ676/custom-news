import "server-only";

import { llmClient } from "@/lib/llm/client";
import {
  NextQuestionResultSchema,
  NEWSDATA_CATEGORIES,
  type NextQuestionResult,
  type RefineAnswer,
} from "@/lib/interests/refine";

const MAX_QUESTIONS = 3;

const SYSTEM_PROMPT = `You help users refine a news interest into a precise query for the News Data io API.

Your goal: ask targeted multiple-choice questions that will help narrow the interest into the most relevant news articles. Each option you generate carries an "effects" object — the exact News Data io query params that option contributes.

News Data io params you can use in effects:
- q: full-text boolean query (supports AND, OR, NOT, "exact phrase")
- qInTitle: same syntax but only searches headlines
- category: one of: ${NEWSDATA_CATEGORIES.join(", ")}
- country: ISO 3166-1 alpha-2 codes, comma-separated (e.g. "us,gb")
- timeframe: hours back as a number string (e.g. "24" = last 24 hours, "72" = last 3 days)

Rules:
- Emit { done: false, question: {...} } when you have a useful question to ask.
- Emit { done: true, question: null } when you have enough info (or after ${MAX_QUESTIONS} questions).
- Always include a neutral "Any / all of the above" option with all-null effects so the user can skip.
- Keep options to 3–5 choices.
- Make prompts concise and conversational — one line each.
- IDs should be short slugs like "funding", "tech-news", "us-only".`;

function buildUserPrompt(interest: string, history: RefineAnswer[]): string {
  if (history.length === 0) {
    return `Interest: "${interest}"\n\nAsk the first refinement question.`;
  }

  const historyText = history
    .map((a) => {
      const labels = a.question.options
        .filter((o) => a.selectedOptionIds.includes(o.id))
        .map((o) => o.label)
        .join(", ");
      return `Q: ${a.question.prompt}\nA: ${labels}`;
    })
    .join("\n\n");

  return `Interest: "${interest}"\n\nConversation so far:\n${historyText}\n\nAsk the next refinement question, or return done:true if you have enough information (max ${MAX_QUESTIONS} questions total, this is question ${history.length + 1}).`;
}

export async function generateNextQuestion(
  interest: string,
  history: RefineAnswer[],
): Promise<NextQuestionResult> {
  if (history.length >= MAX_QUESTIONS) {
    return { done: true, question: null };
  }

  try {
    return await llmClient.completeStructured({
      schema: NextQuestionResultSchema,
      schemaName: "next_question_result",
      system: SYSTEM_PROMPT,
      user: buildUserPrompt(interest, history),
    });
  } catch {
    return { done: true, question: null };
  }
}
