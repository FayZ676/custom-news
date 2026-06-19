import { NextResponse } from "next/server";

import { MIN_SEARCH_QUERY_LENGTH } from "@/lib/newsSearch";
import { searchProviders } from "@/lib/providers/search.server";

export async function POST(request: Request) {
  const { query } = await request.json().catch(() => ({}));
  if (typeof query !== "string" || query.trim().length < MIN_SEARCH_QUERY_LENGTH) {
    return NextResponse.json({ error: "query is too short" }, { status: 400 });
  }

  const articles = await searchProviders({
    q: query,
    qInTitle: null,
    category: null,
    country: null,
    timeframe: null,
    all: [],
    sources: [],
    any: [],
  });
  return NextResponse.json({ articles });
}
