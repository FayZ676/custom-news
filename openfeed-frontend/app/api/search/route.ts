import { NextRequest, NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { embedTexts } from "@/lib/embeddings";
import { rerankTexts } from "@/lib/reranker";
import { matchStoriesByEmbedding } from "@/lib/supabase/queries/match_stories";
import { getStoriesByIds } from "@/lib/supabase/queries/global_stories";
import { getGlobalSettings } from "@/lib/supabase/queries/global_settings";

const MAX_LANDING_RESULTS = 5;

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get("q")?.trim();
  if (!query) return NextResponse.json({ results: [] });

  const supabase = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );

  const settings = await getGlobalSettings(supabase);
  const { embeddings } = await embedTexts([query]);
  const matches = await matchStoriesByEmbedding(
    supabase,
    embeddings[0],
    settings.max_match_count,
    settings.min_similarity_threshold,
  );

  if (matches.length === 0) return NextResponse.json({ results: [] });

  const stories = await getStoriesByIds(
    supabase,
    matches.map((m) => m.id),
  );
  const reranked = await rerankTexts(
    query,
    stories.map((s) => s.headline),
  );

  const results = reranked.slice(0, MAX_LANDING_RESULTS).map((r) => ({
    title: stories[r.index].headline,
    summary: stories[r.index].summary,
    feed_title: null,
    url: stories[r.index].related_articles_urls[0] ?? null,
  }));

  return NextResponse.json({ results });
}
