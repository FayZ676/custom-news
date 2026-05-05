import { NextRequest, NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { embedTexts } from "@/lib/embeddings";
import { rerankTexts } from "@/lib/reranker";
import { matchArticlesHybrid } from "@/lib/supabase/queries/match_articles";
import { getGlobalArticlesByIds } from "@/lib/supabase/queries/global_articles";
import { getGlobalSettings } from "@/lib/supabase/queries/global_settings";
import { extractQueryKeywords } from "@/lib/keywords";

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
  const keywords = extractQueryKeywords(query);

  const matches = await matchArticlesHybrid(
    supabase,
    embeddings[0],
    keywords,
    settings.max_match_count,
    settings.min_similarity_threshold,
  );

  if (matches.length === 0) return NextResponse.json({ results: [] });

  const articles = await getGlobalArticlesByIds(
    supabase,
    matches.map((m) => m.id),
  );
  const reranked = await rerankTexts(
    query,
    articles.map((a) => a.global_article.title),
  );

  const results = reranked.slice(0, MAX_LANDING_RESULTS).map((r) => ({
    title: articles[r.index].global_article.title,
    summary: articles[r.index].global_article.summary,
    feed_title: articles[r.index].global_article.feed_title,
    url: articles[r.index].global_article.url,
  }));

  return NextResponse.json({ results });
}
