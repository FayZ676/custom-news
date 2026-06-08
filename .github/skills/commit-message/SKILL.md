---
name: commit-message
description: "Generate a compact, consistent one-line git commit message from staged changes. Use when writing commit subjects, summarizing staged diffs, or standardizing commit tone and format."
argument-hint: "Optional: style prefs (conventional or plain), max length, and scope"
user-invocable: true
---

# One-Line Commit Message

## When to Use

- You have staged changes and want one clean commit subject.
- You want consistent formatting across commits.
- You want a fast message draft before committing.

## Inputs

- Staged diff summary (`git diff --staged --name-status` and key hunks).
- Optional preferences:
  - style: `conventional` or `plain`
  - max length (default: 72)
  - scope (for conventional style)

## Procedure

1. Verify staged state.
2. If nothing is staged, return: `No staged changes to summarize.`
3. Extract the dominant intent from staged files:
   - feature behavior -> `feat`
   - bug fix -> `fix`
   - refactor without behavior change -> `refactor`
   - tests only -> `test`
   - docs only -> `docs`
   - tooling/build/chore -> `chore`
4. Build a single imperative subject line:
   - plain: `<verb> <primary outcome>`
   - conventional: `<type>(<scope>): <verb> <primary outcome>`
5. Keep it compact and stable:
   - one line only
   - no trailing period
   - avoid filler words
   - use present-imperative verb (`add`, `fix`, `refactor`, `update`)
6. Apply length policy:
   - target <= 72 characters unless user provided a different max
   - if too long, remove secondary details before changing verb/noun core
7. Return exactly one candidate line, then include an optional fallback only if confidence is low.

## Decision Rules

- Mixed changes with one clear dominant intent: summarize only the dominant intent.
- Mixed changes with no dominant intent: prefer `chore` (or plain neutral verb `update`).
- Rename/move only: use `refactor` or plain `reorganize`.
- Revert-like staged changes: use `revert` phrasing.

## Quality Checks

- Captures the main user-visible or developer-impactful change.
- Consistent style with user preference when provided.
- Stays within length budget.
- Reads naturally as a commit subject.

## Output Contract

- Primary output: one single-line commit message.
- Optional fallback: one alternative line only when requested or low confidence.
