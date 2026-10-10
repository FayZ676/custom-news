import "server-only";

import {
  MAX_CANDIDATES,
  MIN_SIMILARITY,
  windowStart,
} from "@/lib/pipeline/config";
import { judgeCandidates, type Judgment } from "@/lib/pipeline/judge";
import { embed, toVector } from "@/lib/pipeline/voyage";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import {
  matchArticles,
  type MatchedArticle,
} from "@/lib/supabase/queries/global_articles";
import {
  getAllInterests,
  getInterestById,
  setInterestEmbedding,
  type EmbeddedUserInterest,
} from "@/lib/supabase/queries/user_interests";
import { insertMatches } from "@/lib/supabase/queries/user_article_matches";
import { insertUserArticles } from "@/lib/supabase/queries/user_articles";

export interface JudgedArticle extends MatchedArticle {
  judgment: Judgment;
}

async function embedQuery(text: string): Promise<string> {
  const [embedding] = await embed([text], "query");
  return toVector(embedding);
}

// Retrieve the nearest unjudged articles, then let the judge decide.
async function judgeNearest(
  interestText: string,
  embedding: string,
  interestId?: string,
): Promise<JudgedArticle[]> {
  const supabase = createServiceRoleClient();
  const candidates = await matchArticles(supabase, {
    embedding,
    since: windowStart(),
    minSimilarity: MIN_SIMILARITY,
    limit: MAX_CANDIDATES,
    interestId,
  });
  const judgments = await judgeCandidates(interestText, candidates);
  return candidates.flatMap((article, i) => {
    const judgment = judgments[i];
    return judgment ? [{ ...article, judgment }] : [];
  });
}

async function matchEmbeddedInterest(
  interest: EmbeddedUserInterest,
): Promise<number> {
  const supabase = createServiceRoleClient();
  let embedding = interest.embedding;
  if (!embedding) {
    embedding = await embedQuery(interest.interest_text);
    await setInterestEmbedding(supabase, interest.id, embedding);
  }

  const judged = await judgeNearest(
    interest.interest_text,
    embedding,
    interest.id,
  );

  await insertMatches(
    supabase,
    judged.map((a) => ({
      interest_id: interest.id,
      article_id: a.id,
      user_id: interest.user_id,
      similarity: a.similarity,
      relevant: a.judgment.relevant,
      reason: a.judgment.reason,
    })),
  );
  const relevant = judged.filter((a) => a.judgment.relevant);
  await insertUserArticles(
    supabase,
    relevant.map((a) => ({
      user_id: interest.user_id,
      article_id: a.id,
      interest_id: interest.id,
    })),
  );
  return relevant.length;
}

export async function matchInterest(interestId: string): Promise<number> {
  const interest = await getInterestById(
    createServiceRoleClient(),
    interestId,
  );
  return matchEmbeddedInterest(interest);
}

export interface MatchResult {
  interests: number;
  failed: number;
  added: number;
}

export async function matchAllInterests(): Promise<MatchResult> {
  const interests = await getAllInterests(createServiceRoleClient());
  const results = await Promise.allSettled(
    interests.map(matchEmbeddedInterest),
  );

  let failed = 0;
  let added = 0;
  results.forEach((result, i) => {
    if (result.status === "fulfilled") {
      added += result.value;
    } else {
      failed += 1;
      console.error(`match failed for interest ${interests[i].id}:`, result.reason);
    }
  });
  return { interests: interests.length, failed, added };
}

// What an interest description would match right now, without saving
// anything. Rejected articles are included so the reasons can be compared.
export async function previewInterest(
  interestText: string,
): Promise<JudgedArticle[]> {
  return judgeNearest(interestText, await embedQuery(interestText));
}
