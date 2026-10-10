import "server-only";

import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";

import { JUDGE_MODEL } from "@/lib/pipeline/config";

const SYSTEM_PROMPT = `You filter a personal tech news feed. The reader has described, in their own words, what they want to read about. For each candidate article, decide whether this reader would want it in their feed.

- Judge what the article is mainly about. An article that only mentions the topic in passing is not relevant.
- Respect everything the description says, including anything the reader wants to exclude.
- Give a one-sentence reason that names the specific thing that makes the article relevant or not.`;

export interface Candidate {
  title: string;
  source_name: string;
  summary: string | null;
}

export interface Judgment {
  relevant: boolean;
  reason: string;
}

const JudgmentsSchema = z.object({
  judgments: z.array(
    z.object({
      index: z.number().int(),
      relevant: z.boolean(),
      reason: z.string(),
    }),
  ),
});

const client = new Anthropic();

function formatCandidates(candidates: Candidate[]): string {
  return candidates
    .map(
      (c, index) =>
        `<article index="${index}">\nSource: ${c.source_name}\nTitle: ${c.title}\nSummary: ${c.summary ?? "(none)"}\n</article>`,
    )
    .join("\n");
}

// Returns one judgment per candidate, in order. A candidate the model skipped
// comes back undefined so the caller can leave it to be judged next run.
export async function judgeCandidates(
  interestText: string,
  candidates: Candidate[],
): Promise<(Judgment | undefined)[]> {
  if (candidates.length === 0) return [];

  const response = await client.messages.parse({
    model: JUDGE_MODEL,
    max_tokens: 16000,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `<interest>\n${interestText}\n</interest>\n\n${formatCandidates(candidates)}`,
      },
    ],
    output_config: {
      effort: "low",
      format: zodOutputFormat(JudgmentsSchema),
    },
  });

  if (response.stop_reason === "refusal" || !response.parsed_output) {
    throw new Error(`Judge returned no judgments (${response.stop_reason})`);
  }

  const byIndex = new Map(
    response.parsed_output.judgments.map((j) => [j.index, j]),
  );
  return candidates.map((_, index) => {
    const judgment = byIndex.get(index);
    return judgment && { relevant: judgment.relevant, reason: judgment.reason };
  });
}
