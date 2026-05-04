from functools import reduce
from typing import Callable


Belief = dict[str, float]
Likelihood = Callable[[str], float]


def update(prior: Belief, likelihood: Likelihood) -> Belief:
    """Bayes' rule as a pure function. Returns a new Belief — no mutation."""
    unnormalized = {h: p * likelihood(h) for h, p in prior.items()}
    total = sum(unnormalized.values())
    if total == 0:
        raise ValueError("All hypotheses have zero probability.")
    return {h: p / total for h, p in unnormalized.items()}


def update_all(prior: Belief, likelihoods: list[Likelihood]) -> Belief:
    """Fold update() over a list of likelihoods."""
    return reduce(update, likelihoods, prior)
