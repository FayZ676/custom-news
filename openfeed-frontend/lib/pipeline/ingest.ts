import "server-only";

import { windowStart } from "@/lib/pipeline/config";
import { fetchFeed } from "@/lib/pipeline/rss";
import { embed, toVector } from "@/lib/pipeline/voyage";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { getGlobalFeeds } from "@/lib/supabase/queries/global_feeds";
import {
  getUnembeddedArticles,
  insertGlobalArticles,
  setArticleEmbedding,
} from "@/lib/supabase/queries/global_articles";

const UPDATE_CHUNK_SIZE = 50;

export interface IngestResult {
  feeds: number;
  failedFeeds: string[];
  fetched: number;
  embedded: number;
}

// Pulls every feed, stores articles inside the matching window, then embeds
// whatever hasn't been embedded yet (including leftovers from failed runs).
export async function ingestArticles(): Promise<IngestResult> {
  const supabase = createServiceRoleClient();
  const feeds = await getGlobalFeeds(supabase);
  const since = windowStart();

  const results = await Promise.allSettled(feeds.map(fetchFeed));
  const failedFeeds: string[] = [];
  const articles = results.flatMap((result, i) => {
    if (result.status === "fulfilled") return result.value;
    failedFeeds.push(`${feeds[i].title}: ${result.reason}`);
    return [];
  });
  const recent = articles.filter((a) => a.published_at >= since);
  await insertGlobalArticles(supabase, recent);

  const pending = await getUnembeddedArticles(supabase);
  const embeddings = await embed(
    pending.map((a) => `${a.title}\n\n${a.summary ?? ""}`.trim()),
    "document",
  );
  for (let i = 0; i < pending.length; i += UPDATE_CHUNK_SIZE) {
    await Promise.all(
      pending
        .slice(i, i + UPDATE_CHUNK_SIZE)
        .map((a, j) =>
          setArticleEmbedding(supabase, a.id, toVector(embeddings[i + j])),
        ),
    );
  }

  return {
    feeds: feeds.length,
    failedFeeds,
    fetched: recent.length,
    embedded: pending.length,
  };
}
