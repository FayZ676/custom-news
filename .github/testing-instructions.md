# Testing Instructions

This document captures the testing principles and patterns used in this project, derived from experience writing and refining the test suite.

---

## Core Philosophy

Tests should be held to the same standards as production code: **functional, minimal, and purposeful**. Every test and every assertion should earn its place. If you can remove something without losing coverage, remove it.

---

## Eliminate Redundancy Before Writing More Tests

Before adding a new test, ask: *is this already implied by something that exists?*

**Subsumed assertions** — an assertion is redundant if failing it necessarily means another assertion also fails with a better message. For example:

- `assert collection` (non-empty check) is subsumed by `assert expected_value in collection` — the membership check fails more informatively when the collection is empty
- A depth/ordering invariant is subsumed by an ancestor/containment invariant — if B is an ancestor of A, A's depth being ≥ B's depth is a logical consequence, not an independent fact

**Subsumed tests** — a test is redundant if its assertions are a strict subset of another test's assertions, or if a failure would always co-occur with another test's failure. Remove it.

---

## Share Expensive Setup — Never Repeat I/O

If multiple assertions operate on the same output, **compute the output once and share it**.

For integration tests that make real API or database calls, use a module-scoped fixture to cache results:

```python
@pytest.fixture(scope="module")
def classified(taxonomy):
    """Run classify_article once per fixture — shared across all assertions."""
    return {
        f["title"]: (f, classify_article(f"{f['title']}\n\n{f['summary']}", taxonomy, client))
        for f in FIXTURES
    }
```

This turns N parametrized test functions × M fixtures = N×M API calls into M calls total. The test suite for the IPTC classifier went from 15 API calls (60s) to 3 (14s) by applying this pattern.

---

## Consolidate Related Assertions Into One Test

Separate parametrized test functions that operate on the same result should be merged into a single test with multiple assertions. One test per invariant *of a given output* — not one test per function.

**Before:** 5 test functions, each calling `classify_article` independently per fixture = 15 API calls.

**After:** 1 test function using a shared fixture, 3 assertions = 3 API calls.

The rule: **one test per article/input, not one test per assertion type**.

---

## Use Functional Patterns in Test Bodies

Apply the same functional programming principles to test code as to production code.

**Prefer `all()` over `for` loops with asserts:**

```python
# Imperative — don't do this
for item in items:
    assert predicate(item), f"Failed for {item}"

# Declarative — do this
assert all(predicate(item) for item in items), (
    f"Failed for: {[item for item in items if not predicate(item)]}"
)
```

**Extract pure predicate functions** for any non-trivial condition checked across multiple items:

```python
def _within_pass1_branch(t: ClassifiedTopic, taxonomy: Taxonomy, pass1_ids: set[str]) -> bool:
    return bool(set(taxonomy[t.medtop_id].ancestors) & pass1_ids)
```

Pure predicates are:
- Reusable in both the `all()` check and the failure message's filter
- Testable independently if needed
- Named, making the assertion's intent self-documenting

---

## Pin External Data Inline

Integration tests that use real external data (database records, API responses) should **pin the data inline** as string fixtures rather than querying live at test time. This makes tests:

- Runnable without a live DB connection
- Deterministic (not affected by data changes)
- Fast to understand — the input is right there in the file

```python
FIXTURES = [
    {
        "title": "Tesla reveals two Robotaxi crashes involving teleoperators",
        "summary": "Tesla disclosed newly unredacted crash reports...",
        "expected_root": "medtop:13000000",  # science and technology
    },
]
```

Sample data from a real source (e.g. local Supabase) to ensure the fixtures are realistic, then commit them as literals.

---

## Summary Checklist

Before committing tests, verify:

- [ ] No assertion is implied by another assertion in the same test
- [ ] No test duplicates the assertions of another test
- [ ] No I/O (API calls, DB queries) is repeated across tests when results can be shared via a fixture
- [ ] `for` loops with `assert` inside are replaced with `all()` + pure predicates
- [ ] External data is pinned inline, not fetched live
- [ ] Every test function has a single, clear responsibility
