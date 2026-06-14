import { FEEDS_BY_KEY } from "@/lib/providers/feeds";
import { createRssProvider, type FeedCache } from "@/lib/providers/rss";
import type { Provider } from "@/lib/providers/types";

// Resolves stored subscription keys to RSS providers, ignoring any key whose
// feed has since been removed from the catalog.
export function getProvidersForKeys(
  keys: string[],
  cache: FeedCache,
): Provider[] {
  const providers: Provider[] = [];
  for (const key of keys) {
    const def = FEEDS_BY_KEY.get(key);
    if (def) providers.push(createRssProvider(def, cache));
  }
  return providers;
}
