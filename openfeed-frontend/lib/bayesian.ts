/**
 * Bayesian inference utilities for combining multiple relevance signals.
 * Adapted from the backend clusterer's approach for query-to-article matching.
 */

export type Belief = Record<string, number>;
export type Likelihood = (hypothesis: string) => number;

/**
 * Updates a prior belief with a likelihood function (Bayes' theorem).
 */
export function update(prior: Belief, likelihood: Likelihood): Belief {
  const unnormalized: Belief = {};
  for (const [hypothesis, p] of Object.entries(prior)) {
    unnormalized[hypothesis] = p * likelihood(hypothesis);
  }

  const total = Object.values(unnormalized).reduce((sum, p) => sum + p, 0);
  const normalized: Belief = {};
  for (const [hypothesis, p] of Object.entries(unnormalized)) {
    normalized[hypothesis] = p / total;
  }

  return normalized;
}

/**
 * Sequentially applies multiple likelihood functions to a prior.
 */
export function updateAll(prior: Belief, likelihoods: Likelihood[]): Belief {
  return likelihoods.reduce((belief, likelihood) => update(belief, likelihood), prior);
}

/**
 * Prior belief for article relevance.
 * Base rate: most random articles are not relevant to a given query.
 */
const QUERY_PRIOR: Belief = {
  relevant: 0.1, // 10% base rate
  not_relevant: 0.9,
};

/**
 * Creates a likelihood function from embedding similarity score.
 * Higher similarity → higher probability of relevance.
 */
function embeddingLikelihood(similarity: number): Likelihood {
  let bucket: "high" | "mid" | "low";
  if (similarity > 0.80) {
    bucket = "high";
  } else if (similarity > 0.60) {
    bucket = "mid";
  } else {
    bucket = "low";
  }

  const rates = {
    high: { relevant: 0.90, not_relevant: 0.10 },
    mid: { relevant: 0.50, not_relevant: 0.40 },
    low: { relevant: 0.10, not_relevant: 0.80 },
  }[bucket];

  return (hypothesis: string) => rates[hypothesis as keyof typeof rates];
}

/**
 * Creates a likelihood function from entity/keyword Jaccard similarity.
 * Higher overlap → higher probability of relevance.
 */
function entityLikelihood(jaccard: number): Likelihood {
  let bucket: "high" | "mid" | "low";
  if (jaccard > 0.30) {
    bucket = "high";
  } else if (jaccard > 0.10) {
    bucket = "mid";
  } else {
    bucket = "low";
  }

  const rates = {
    high: { relevant: 0.85, not_relevant: 0.10 },
    mid: { relevant: 0.50, not_relevant: 0.30 },
    low: { relevant: 0.10, not_relevant: 0.70 },
  }[bucket];

  return (hypothesis: string) => rates[hypothesis as keyof typeof rates];
}

/**
 * Combines embedding and entity signals to score article relevance.
 * Returns P(relevant | embedding, entities) ∈ [0, 1].
 */
export function scoreArticleRelevance(
  embeddingSimilarity: number | null,
  entityJaccard: number | null,
): number {
  const likelihoods: Likelihood[] = [];

  if (embeddingSimilarity !== null) {
    likelihoods.push(embeddingLikelihood(embeddingSimilarity));
  }

  if (entityJaccard !== null) {
    likelihoods.push(entityLikelihood(entityJaccard));
  }

  if (likelihoods.length === 0) {
    return 0.0; // No signals available
  }

  const posterior = updateAll(QUERY_PRIOR, likelihoods);
  return posterior.relevant;
}
