### Functional Programming Approach

This project favors a **functional programming** style. When solving problems, prefer:

- **Pure functions**: Functions should have no side effects and return the same output for the same input. This makes code predictable, easy to test, and easy to reason about.
- **Immutability**: Avoid mutating data in place. Prefer creating new data structures over modifying existing ones.
- **Function composition**: Build complex behavior by composing small, focused functions rather than creating large, monolithic ones.
- **Declarative over imperative**: Express _what_ should happen, not _how_ it should happen step-by-step.
- **Avoid shared state**: Minimize reliance on shared mutable state, which is the root cause of most bugs in complex systems.

**Why?** Functional code is easier to test (pure functions need no mocks or setup), easier to refactor (no hidden dependencies via side effects), and easier to parallelize (no shared state).

When suggesting solutions, default to functional patterns (e.g. `map`, `filter`, `reduce` over loops; immutable updates over mutations; small composable utilities over class hierarchies) unless there is a clear reason not to.

### Problem solving

When given a problem to solve (a new feature, a bug, etc) always go through the following steps with the user:

1. Summarize the users request into the key points and clarify with the user that you understood their request correctly.
2. Go through this checklist of questions.
   - Ask relevant follow up / clarifying questions regarding their query
   - Ask them for any relevant documentation that pertains to the task
3. **Before proposing anything, do all of the following without exception:**
   - **Search the existing codebase exhaustively** for any files, patterns, or conventions that are directly relevant to the problem. Never assume how something is done — read it.
   - **Research the official documentation** of every library or framework involved (e.g. Supabase, Next.js). Use available tools to fetch docs or source references. Never rely on assumed knowledge of how a library works.
   - **Compare the existing codebase patterns against official recommendations.** If they differ, flag it and ask the user — do not silently override one with the other.
   - **Make zero assumptions.** If something is unclear — about the codebase, the library, the environment, or the intent — stop and ask. An extra clarifying question is always cheaper than a wrong implementation.
4. Based on the users feedback, propose the most simple, minimal, and effective solution you can come up with that is consistent with both the existing codebase patterns and the official documentation.
5. Analyze the users thoughts and feedback regarding your proposal and repeat steps 2–4 as necessary.
6. Present the suggested implementation with clear code examples and explanations, but NEVER directly modify files or create code changes without explicit user instruction to do so.
7. Wait for the user to explicitly ask you to implement the changes before using any file modification tools.

### Code Changes Policy

- **NEVER** directly create, edit, or modify files
- **ALWAYS** suggest changes with clear code examples instead of applying them
- Provide complete, copy-pasteable code snippets that show exactly what should change
- Show before/after comparisons when helpful
- Explain the reasoning behind suggested changes
