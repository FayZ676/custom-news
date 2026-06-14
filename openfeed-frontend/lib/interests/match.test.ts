import { describe, expect, it } from "vitest";

import { matchesQuery, type MatchableItem } from "./match";
import type { NewsQueryPayload } from "./refine";

const base: NewsQueryPayload = {
  q: null,
  qInTitle: null,
  category: null,
  country: null,
  timeframe: null,
};

function item(overrides: Partial<MatchableItem>): MatchableItem {
  return { title: "", summary: null, ...overrides };
}

describe("matchesQuery", () => {
  it("matches a single bare term against title or summary, case-insensitively", () => {
    expect(
      matchesQuery({ ...base, q: "Valve" }, item({ title: "VALVE ships hardware" })),
    ).toBe(true);
    expect(
      matchesQuery({ ...base, q: "valve" }, item({ title: "x", summary: "A new VALVE thing" })),
    ).toBe(true);
    expect(matchesQuery({ ...base, q: "valve" }, item({ title: "nintendo" }))).toBe(
      false,
    );
  });

  it("treats bare space-separated terms as AND", () => {
    expect(
      matchesQuery({ ...base, q: "valve steam" }, item({ title: "valve and steam news" })),
    ).toBe(true);
    expect(
      matchesQuery({ ...base, q: "valve steam" }, item({ title: "only valve here" })),
    ).toBe(false);
  });

  it("evaluates AND / OR / NOT with parentheses", () => {
    const payload = {
      ...base,
      q: "valve AND steam AND (deck OR machine OR frame)",
    };
    expect(
      matchesQuery(payload, item({ title: "Valve Steam Deck announced" })),
    ).toBe(true);
    expect(
      matchesQuery(payload, item({ title: "Valve Steam Frame VR" })),
    ).toBe(true);
    // Missing the third clause (no deck/machine/frame).
    expect(
      matchesQuery(payload, item({ title: "Valve Steam controller" })),
    ).toBe(false);
  });

  it("honours NOT", () => {
    expect(
      matchesQuery({ ...base, q: "steam NOT deck" }, item({ title: "steam deck" })),
    ).toBe(false);
    expect(
      matchesQuery({ ...base, q: "steam NOT deck" }, item({ title: "steam frame" })),
    ).toBe(true);
  });

  it("matches quoted phrases as a unit", () => {
    expect(
      matchesQuery(
        { ...base, q: '"steam deck"' },
        item({ title: "the steam deck is great" }),
      ),
    ).toBe(true);
    expect(
      matchesQuery(
        { ...base, q: '"steam deck"' },
        item({ title: "steam and deck separately" }),
      ),
    ).toBe(false);
  });

  it("matches qInTitle against the title only", () => {
    expect(
      matchesQuery(
        { ...base, qInTitle: "elections" },
        item({ title: "Elections today", summary: "x" }),
      ),
    ).toBe(true);
    expect(
      matchesQuery(
        { ...base, qInTitle: "elections" },
        item({ title: "Politics", summary: "about elections" }),
      ),
    ).toBe(false);
  });

  it("applies timeframe as a recency bound", () => {
    const recent = new Date(Date.now() - 60 * 60 * 1000).toISOString(); // 1h ago
    const old = new Date(Date.now() - 100 * 60 * 60 * 1000).toISOString(); // ~4d ago
    const payload = { ...base, q: "ai", timeframe: "48" };
    expect(matchesQuery(payload, item({ title: "ai", published_at: recent }))).toBe(
      true,
    );
    expect(matchesQuery(payload, item({ title: "ai", published_at: old }))).toBe(
      false,
    );
  });

  it("returns true when there is no query to filter by", () => {
    expect(matchesQuery(base, item({ title: "anything" }))).toBe(true);
  });
});
