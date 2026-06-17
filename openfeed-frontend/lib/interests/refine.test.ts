import { describe, expect, it } from "vitest";

import {
  normalizeNewsQueryPayload,
  payloadToParams,
  type NewsQueryPayload,
} from "./refine";

const base: NewsQueryPayload = {
  q: null,
  qInTitle: null,
  category: null,
  country: null,
  timeframe: null,
  all: [],
  any: [],
  sources: [],
};

describe("normalizeNewsQueryPayload", () => {
  it("keeps q and drops qInTitle when both are set (mutual exclusivity)", () => {
    const result = normalizeNewsQueryPayload({
      ...base,
      q: "climate",
      qInTitle: "climate",
    });
    expect(result.q).toBe("climate");
    expect(result.qInTitle).toBeNull();
  });

  it("preserves a qInTitle-only query", () => {
    const result = normalizeNewsQueryPayload({ ...base, qInTitle: "elections" });
    expect(result.q).toBeNull();
    expect(result.qInTitle).toBe("elections");
  });

  it("converts empty/whitespace strings to null", () => {
    const result = normalizeNewsQueryPayload({
      ...base,
      q: "   ",
      country: "  ",
      timeframe: "",
    });
    expect(result.q).toBeNull();
    expect(result.qInTitle).toBeNull();
    expect(result.country).toBeNull();
    expect(result.timeframe).toBeNull();
  });

  it("truncates the query string to 512 characters", () => {
    const long = "a".repeat(600);
    const result = normalizeNewsQueryPayload({ ...base, q: long });
    expect(result.q).toHaveLength(512);
  });

  describe("timeframe", () => {
    it("clamps hours to 1–48", () => {
      expect(normalizeNewsQueryPayload({ ...base, timeframe: "72" }).timeframe).toBe("48");
      expect(normalizeNewsQueryPayload({ ...base, timeframe: "24" }).timeframe).toBe("24");
      expect(normalizeNewsQueryPayload({ ...base, timeframe: "0" }).timeframe).toBeNull();
    });

    it("clamps minutes to 1–2880 and keeps the m suffix", () => {
      expect(normalizeNewsQueryPayload({ ...base, timeframe: "30m" }).timeframe).toBe("30m");
      expect(normalizeNewsQueryPayload({ ...base, timeframe: "5000m" }).timeframe).toBe("2880m");
    });

    it("rejects non-numeric timeframes", () => {
      expect(normalizeNewsQueryPayload({ ...base, timeframe: "soon" }).timeframe).toBeNull();
    });
  });

  describe("country", () => {
    it("caps to the first 5 codes", () => {
      const result = normalizeNewsQueryPayload({
        ...base,
        country: "us,gb,fr,de,it,es,jp",
      });
      expect(result.country).toBe("us,gb,fr,de,it");
    });

    it("lowercases and drops malformed codes", () => {
      const result = normalizeNewsQueryPayload({
        ...base,
        country: "US, xyz, gb, 1",
      });
      expect(result.country).toBe("us,gb");
    });

    it("returns null when no valid codes remain", () => {
      expect(normalizeNewsQueryPayload({ ...base, country: "usa, 123" }).country).toBeNull();
    });
  });
});

describe("payloadToParams", () => {
  it("injects defaults and the api key", () => {
    const params = payloadToParams({ ...base, q: "ai" }, "KEY");
    expect(params).toMatchObject({
      apikey: "KEY",
      language: "en",
      removeduplicate: "1",
      q: "ai",
    });
  });

  it("never emits both q and qInTitle", () => {
    const params = payloadToParams(
      { ...base, q: "ai", qInTitle: "ai" },
      "KEY",
    );
    expect(params.q).toBe("ai");
    expect(params.qInTitle).toBeUndefined();
  });

  it("omits fields that normalize to null", () => {
    const params = payloadToParams(
      { ...base, q: "ai", country: "usa", timeframe: "bogus" },
      "KEY",
    );
    expect(params.country).toBeUndefined();
    expect(params.timeframe).toBeUndefined();
  });
});
