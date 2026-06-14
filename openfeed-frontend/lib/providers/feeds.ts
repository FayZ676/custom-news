import type { FeedDefinition } from "@/lib/providers/types";

// Curated, pre-verified RSS feeds users can subscribe to. This is the single
// source of truth for "extra sources" — adding one is one entry here. Sources
// users request that aren't listed go through the existing feedback flow.
//
// Client-safe (no server-only imports) so both the UI and the server-side
// provider layer share one definition.
export const EXTRA_FEEDS: FeedDefinition[] = [
  {
    key: "towards-data-science",
    label: "Towards Data Science",
    feedUrl: "https://towardsdatascience.com/feed",
  },
];

export const FEEDS_BY_KEY = new Map(EXTRA_FEEDS.map((feed) => [feed.key, feed]));
