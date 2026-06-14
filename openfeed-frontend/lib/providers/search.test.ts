import { beforeEach, describe, expect, it, vi } from "vitest";

import type { FeedArticle } from "@/lib/newsSearch";
import type { Provider } from "./types";

function article(title: string, url: string): FeedArticle {
  return {
    id: url,
    title,
    summary: null,
    url,
    source_name: title,
    published_at: "2026-06-01T00:00:00Z",
    image_url: null,
  };
}

const newsDataSearch = vi.fn();
vi.mock("./newsdata", () => ({
  newsDataProvider: {
    key: "newsdata",
    search: (...args: unknown[]) => newsDataSearch(...args),
  },
}));

vi.mock("./catalog", () => ({
  getProvidersForKeys: vi.fn(),
}));

import { searchProviders } from "./search.server";
import { getProvidersForKeys } from "./catalog";

const emptyPayload = {
  q: "ai",
  qInTitle: null,
  category: null,
  country: null,
  timeframe: null,
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("searchProviders", () => {
  it("queries only NewsData when there are no subscribed sources", async () => {
    newsDataSearch.mockResolvedValue([article("nd", "https://a")]);
    vi.mocked(getProvidersForKeys).mockReturnValue([]);

    const results = await searchProviders(emptyPayload, []);

    expect(results).toHaveLength(1);
    expect(vi.mocked(getProvidersForKeys)).toHaveBeenCalledWith(
      [],
      expect.any(Map),
    );
  });

  it("merges NewsData + subscribed providers and de-dups by URL", async () => {
    newsDataSearch.mockResolvedValue([
      article("nd", "https://a"),
      article("nd", "https://b"),
    ]);
    const rss: Provider = {
      key: "tds",
      // One duplicate URL (https://a) and one new (https://c).
      search: vi.fn(async () => [
        article("rss-dup", "https://a"),
        article("rss-new", "https://c"),
      ]),
    };
    vi.mocked(getProvidersForKeys).mockReturnValue([rss]);

    const results = await searchProviders(emptyPayload, ["tds"]);
    const urls = results.map((r) => r.url).sort();

    expect(urls).toEqual(["https://a", "https://b", "https://c"]);
    // First occurrence (NewsData) wins for the duplicate URL.
    const a = results.find((r) => r.url === "https://a");
    expect(a?.title).toBe("nd");
  });
});
