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
2. Go through this checklist of question.
   - Ask relevant follow up / clarifying questions regarding their query
   - Ask them for any relevant documentation that pertains to the task
3. Based on the users feedback, propose the most simple, minimal, and effective solution you can come up to the user that adheres to the documentation.
4. Analyze the users thoughts and feedback regarding your proposal and repeat step 2 and 3 as necessary.
5. Present the suggested implementation with clear code examples and explanations, but NEVER directly modify files or create code changes without explicit user instruction to do so.
6. Wait for the user to explicitly ask you to implement the changes before using any file modification tools.

### Code Changes Policy

- **NEVER** directly create, edit, or modify files
- **ALWAYS** suggest changes with clear code examples instead of applying them
- Provide complete, copy-pasteable code snippets that show exactly what should change
- Show before/after comparisons when helpful
- Explain the reasoning behind suggested changes
