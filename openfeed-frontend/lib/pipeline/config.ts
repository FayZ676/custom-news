// Every relevance knob lives here. The judge's prompt is in judge.ts.

// Only articles published within this window are stored and matched.
export const ARTICLE_WINDOW_DAYS = 3;

// Retrieval: the nearest articles to an interest's embedding, above a floor.
export const MIN_SIMILARITY = 0.35;
export const MAX_CANDIDATES = 30;

export const EMBEDDING_MODEL = "voyage-3.5";
export const JUDGE_MODEL = "claude-haiku-5-5";

export function windowStart(): string {
  return new Date(
    Date.now() - ARTICLE_WINDOW_DAYS * 24 * 60 * 60 * 1000,
  ).toISOString();
}
