import { NextRequest, NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { searchStories } from "../../../lib/story-search";
import { getStoriesByIds } from "@/lib/supabase/queries/global_stories";

const MAX_LANDING_RESULTS = 5;

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get("q")?.trim();
  if (!query) return NextResponse.json({ results: [] });

  const supabase = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );

  const { stories } = await searchStories({
    supabase,
    query,
    loadStoriesByIds: (ids) => getStoriesByIds(supabase, ids),
  });

  if (stories.length === 0) {
    return NextResponse.json({ results: [] });
  }

  const results = stories.slice(0, MAX_LANDING_RESULTS).map((story) => ({
    title: story.headline,
    summary: story.summary,
    feed_title: null,
    url: story.related_articles_urls[0] ?? null,
  }));

  return NextResponse.json({ results });
}
