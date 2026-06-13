import { NextResponse } from "next/server";

import { MIN_SEARCH_QUERY_LENGTH } from "@/lib/newsSearch";
import { fetchLatestNewsArticles } from "@/lib/newsSearch.server";

// Proxies live queries to NewsData.io so the API key stays server-side; the
// browser cannot call NewsData directly. The fetch itself lives in
// lib/newsSearch.server so the feed ingestion path can reuse it.
export async function POST(request: Request) {
  const { query } = await request.json().catch(() => ({}));
  if (typeof query !== "string" || query.trim().length < MIN_SEARCH_QUERY_LENGTH) {
    return NextResponse.json({ error: "query is too short" }, { status: 400 });
  }

  const articles = await fetchLatestNewsArticles(query);
  return NextResponse.json({ articles });
}
