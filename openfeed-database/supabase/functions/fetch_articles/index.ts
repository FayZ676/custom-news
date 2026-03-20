// @ts-nocheck

import { createClient } from "jsr:@supabase/supabase-js@2";
import { parseFeed, type ParsedArticle } from "../_shared/parse_feed.ts";
import { embedArticles } from "../_shared/embed.ts";

// ─── Config ─────────────────────────────────────────────────

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

const MAX_ARTICLES_PER_INTEREST = parseInt(
  Deno.env.get("MAX_ARTICLES_PER_INTEREST") ?? "50",
);

const INSERT_BATCH_SIZE = 500;

// ─── Types ──────────────────────────────────────────────────

interface FeedArticle {
  feed_id: string;
  title: string;
  url: string;
  summary: string | null;
  content: string | null;
  published_at: string;
  parsed: ParsedArticle;
}

interface ArticleDiff {
  newArticles: FeedArticle[];
  staleIds: string[];
  unchangedCount: number;
}

// ─── Steps ──────────────────────────────────────────────────

async function loadFeeds(): Promise<{ id: string; url: string }[]> {
  const { data, error } = await supabase.from("global_feeds").select("id, url");

  if (error) throw error;
  return data;
}

async function parseAllFeeds(
  feeds: { id: string; url: string }[],
): Promise<FeedArticle[]> {
  const articles: FeedArticle[] = [];

  for (const feed of feeds) {
    try {
      const parsed = await parseFeed(feed.url);

      for (const article of parsed) {
        articles.push({
          feed_id: feed.id,
          title: article.title,
          url: article.link,
          summary: article.summary,
          content:
            article.content
              ?.map((c) => c.value)
              .filter(Boolean)
              .join("\n\n") ?? null,
          published_at: article.published,
          parsed: article,
        });
      }
    } catch (e) {
      console.error(`Failed to parse feed ${feed.url}:`, e);
    }
  }

  return articles;
}

async function diffArticles(feedArticles: FeedArticle[]): Promise<ArticleDiff> {
  const { data: existing, error } = await supabase
    .from("global_articles")
    .select("id, url");

  if (error) throw error;

  const existingUrls = new Set(existing.map((a: any) => a.url));
  const feedUrls = new Set(feedArticles.map((a) => a.url));

  return {
    newArticles: feedArticles.filter((a) => !existingUrls.has(a.url)),
    staleIds: existing
      .filter((a: any) => !feedUrls.has(a.url))
      .map((a: any) => a.id),
    unchangedCount: existing.filter((a: any) => feedUrls.has(a.url)).length,
  };
}

async function deleteStaleArticles(staleIds: string[]): Promise<void> {
  if (staleIds.length === 0) return;

  const { error } = await supabase
    .from("global_articles")
    .delete()
    .in("id", staleIds);

  if (error) throw error;
  console.log(`Deleted ${staleIds.length} stale articles`);
}

async function insertNewArticles(
  articles: FeedArticle[],
  embeddings: number[][],
  model: string,
): Promise<void> {
  const rows = articles.map((a, i) => ({
    feed_id: a.feed_id,
    title: a.title,
    url: a.url,
    summary: a.summary,
    content: a.content,
    published_at: a.published_at,
    embeddings: embeddings[i],
    embedding_model: model,
  }));

  for (let i = 0; i < rows.length; i += INSERT_BATCH_SIZE) {
    const batch = rows.slice(i, i + INSERT_BATCH_SIZE);
    const { error } = await supabase.from("global_articles").insert(batch);
    if (error) throw error;
  }

  console.log(`Inserted ${rows.length} new articles`);
}

async function rescoreInterests(): Promise<number> {
  const { data: interests, error } = await supabase
    .from("user_interests")
    .select("id, user_id, embeddings");

  if (error) throw error;

  for (const interest of interests) {
    const { data: topArticles, error: rpcError } = await supabase.rpc(
      "match_articles",
      {
        query_embedding: interest.embeddings,
        match_count: MAX_ARTICLES_PER_INTEREST,
      },
    );

    if (rpcError) throw rpcError;

    const scores = topArticles.map((a: { id: string; similarity: number }) => ({
      user_id: interest.user_id,
      interest_id: interest.id,
      article_id: a.id,
      score: a.similarity,
    }));

    if (scores.length > 0) {
      const { error: upsertError } = await supabase
        .from("user_article_scores")
        .upsert(scores, {
          onConflict: "user_id,interest_id,article_id",
        });

      if (upsertError) throw upsertError;
    }
  }

  return interests.length;
}

async function revalidateFrontend(): Promise<void> {
  const url = Deno.env.get("NEXT_PUBLIC_URL");
  const secret = Deno.env.get("REVALIDATE_SECRET");

  if (!url || !secret) {
    console.warn(
      "NEXT_PUBLIC_URL or REVALIDATE_SECRET not set — skipping revalidation",
    );
    return;
  }

  const res = await fetch(`${url}/api/revalidate`, {
    method: "POST",
    headers: { "x-revalidate-secret": secret },
  });

  if (!res.ok) {
    console.error(`Revalidation failed: ${res.status} ${await res.text()}`);
    return;
  }

  console.log("Frontend cache revalidated");
}

// ─── Handler ────────────────────────────────────────────────

Deno.serve(async () => {
  try {
    const feeds = await loadFeeds();
    const feedArticles = await parseAllFeeds(feeds);
    console.log(
      `Parsed ${feedArticles.length} articles from ${feeds.length} feeds`,
    );

    const { newArticles, staleIds, unchangedCount } =
      await diffArticles(feedArticles);
    console.log(
      `Diff: ${newArticles.length} new, ${staleIds.length} stale, ${unchangedCount} unchanged`,
    );

    await deleteStaleArticles(staleIds);

    if (newArticles.length === 0) {
      console.log("No new articles — nothing to do");
      return Response.json({
        success: true,
        new_articles: 0,
        deleted_articles: staleIds.length,
      });
    }

    const { embeddings, model } = await embedArticles(
      newArticles.map((a) => a.parsed),
    );
    await insertNewArticles(newArticles, embeddings, model);

    const interestsScored = await rescoreInterests();
    console.log(`Scored ${interestsScored} user interests`);

    await revalidateFrontend();

    return Response.json({
      success: true,
      new_articles: newArticles.length,
      deleted_articles: staleIds.length,
      interests_scored: interestsScored,
    });
  } catch (error) {
    console.error("fetch_articles error:", error);
    return Response.json({ error: (error as Error).message }, { status: 500 });
  }
});
