import { NextResponse } from "next/server";

import { MIN_SEARCH_QUERY_LENGTH } from "@/lib/newsSearch";
import { createClient } from "@/lib/supabase/server";
import { searchGlobalArticles } from "@/lib/supabase/queries/global_articles";

const MAX_RESULTS = 50;

export async function POST(request: Request) {
  const { query } = await request.json().catch(() => ({}));
  if (typeof query !== "string" || query.trim().length < MIN_SEARCH_QUERY_LENGTH) {
    return NextResponse.json({ error: "query is too short" }, { status: 400 });
  }

  const supabase = await createClient();
  const articles = await searchGlobalArticles(supabase, query.trim(), MAX_RESULTS);
  return NextResponse.json({ articles });
}
