import { NextRequest, NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

const MAX_LANDING_RESULTS = 5;

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get("q")?.trim();
  if (!query) return NextResponse.json({ results: [] });

  const supabase = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );

  const { data, error } = await supabase
    .from("global_articles")
    .select("title, summary, feed_title, url")
    .or(`title.ilike.%${query}%,summary.ilike.%${query}%`)
    .order("published_at", { ascending: false })
    .limit(MAX_LANDING_RESULTS);

  if (error || !data || data.length === 0) {
    return NextResponse.json({ results: [] });
  }

  const results = data.map((article) => ({
    title: article.title,
    summary: article.summary,
    feed_title: article.feed_title,
    url: article.url,
  }));

  return NextResponse.json({ results });
}
