import { afterEach, describe, expect, it, vi } from "vitest";

import { createRssProvider, fetchFeedOnce, type FeedCache } from "./rss";
import type { FeedDefinition } from "./types";
import type { NewsQueryPayload } from "@/lib/interests/refine";

const def: FeedDefinition = {
  key: "tds",
  label: "Towards Data Science",
  feedUrl: "https://example.com/feed",
};

const emptyPayload: NewsQueryPayload = {
  q: null,
  qInTitle: null,
  category: null,
  country: null,
  timeframe: null,
};

const RSS = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>TDS</title>
    <item>
      <title>Understanding Transformers</title>
      <link>https://example.com/transformers</link>
      <description>A deep dive into attention and transformers</description>
      <pubDate>Mon, 01 Jun 2026 10:00:00 GMT</pubDate>
      <enclosure url="https://example.com/img.png" type="image/png"/>
    </item>
    <item>
      <title>Cooking Pasta</title>
      <link>https://example.com/pasta</link>
      <description>A recipe roundup</description>
      <pubDate>Mon, 01 Jun 2026 10:00:00 GMT</pubDate>
    </item>
  </channel>
</rss>`;

const ATOM = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>Blog</title>
  <entry>
    <title>An AI Models Roundup</title>
    <link href="https://example.com/ai" rel="alternate"/>
    <summary>Notes about ai models</summary>
    <updated>2026-06-01T10:00:00Z</updated>
    <id>https://example.com/ai</id>
  </entry>
</feed>`;

function mockFetch(body: string, ok = true) {
  const fn = vi.fn(async () => ({
    ok,
    status: ok ? 200 : 500,
    text: async () => body,
  }));
  vi.stubGlobal("fetch", fn);
  return fn;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("createRssProvider", () => {
  it("parses RSS items and filters them against the payload", async () => {
    mockFetch(RSS);
    const provider = createRssProvider(def, new Map());
    const results = await provider.search({ ...emptyPayload, q: "transformers" });

    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({
      title: "Understanding Transformers",
      url: "https://example.com/transformers",
      source_name: "Towards Data Science",
      image_url: "https://example.com/img.png",
    });
    expect(results[0].published_at).toBe(
      new Date("Mon, 01 Jun 2026 10:00:00 GMT").toISOString(),
    );
  });

  it("parses Atom entries and resolves the alternate link", async () => {
    mockFetch(ATOM);
    const provider = createRssProvider(def, new Map());
    const results = await provider.search({ ...emptyPayload, q: "ai models" });

    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({
      title: "An AI Models Roundup",
      url: "https://example.com/ai",
      source_name: "Towards Data Science",
    });
  });

  it("returns [] on a failed fetch (failure isolation)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("network down");
      }),
    );
    const provider = createRssProvider(def, new Map());
    expect(await provider.search({ ...emptyPayload, q: "transformers" })).toEqual(
      [],
    );
  });

  it("returns [] on a non-ok response", async () => {
    mockFetch("nope", false);
    const provider = createRssProvider(def, new Map());
    expect(await provider.search({ ...emptyPayload, q: "transformers" })).toEqual(
      [],
    );
  });
});

describe("fetchFeedOnce", () => {
  it("fetches a feed only once per shared cache", async () => {
    const fn = mockFetch(RSS);
    const cache: FeedCache = new Map();

    await fetchFeedOnce(def, cache);
    await fetchFeedOnce(def, cache);

    expect(fn).toHaveBeenCalledTimes(1);
  });
});
