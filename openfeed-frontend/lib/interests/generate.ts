import "server-only";

import { llmClient } from "@/lib/llm/client";
import {
  NextQuestionResultSchema,
  type NextQuestionResult,
  type RefineAnswer,
} from "@/lib/interests/refine";

const MAX_QUESTIONS = 3;

const SYSTEM_PROMPT = `You help users refine a news interest by understanding what they actually care about.

Your goal: ask targeted multiple-choice questions that surface the user's intent — which angle, sub-topic, region, recency, or perspective matters to them. A separate step later turns the full conversation into a search query, so you do NOT need to map answers to query params. Just ask the questions that best clarify the interest.

Rules:
- Emit { done: false, question: {...} } when you have a useful question to ask.
- Emit { done: true, question: null } when you have enough info (or after ${MAX_QUESTIONS} questions).
- Always include a neutral "Any / no preference" option so the user can skip the question.
- Keep options to 3–5 choices.
- Make prompts concise and conversational — one line each.
- Options are plain labels — short, human-readable phrases.
- IDs should be short slugs like "funding", "tech-news", "us-only".
- The user may also type their own free-text answer instead of picking an option; take any prior free-text answers into account when choosing the next question.`;

function buildUserPrompt(interest: string, history: RefineAnswer[]): string {
  if (history.length === 0) {
    return `Interest: "${interest}"\n\nAsk the first refinement question.`;
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
