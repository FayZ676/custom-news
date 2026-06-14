import { describe, expect, it } from "vitest";

import { getProvidersForKeys } from "./catalog";

describe("getProvidersForKeys", () => {
  it("resolves known catalog keys to providers", () => {
    const providers = getProvidersForKeys(["towards-data-science"], new Map());
    expect(providers.map((p) => p.key)).toEqual(["towards-data-science"]);
  });

  it("ignores unknown keys", () => {
    const providers = getProvidersForKeys(
      ["towards-data-science", "not-a-real-feed"],
      new Map(),
    );
    expect(providers.map((p) => p.key)).toEqual(["towards-data-science"]);
  });

  it("returns [] for no keys", () => {
    expect(getProvidersForKeys([], new Map())).toEqual([]);
  });
});
