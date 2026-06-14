import { NextResponse } from "next/server";

import { MIN_SEARCH_QUERY_LENGTH } from "@/lib/newsSearch";
import { fetchLatestNewsForQuery } from "@/lib/newsSearch.server";

export async function POST(request: Request) {
  const { query } = await request.json().catch(() => ({}));
  if (typeof query !== "string" || query.trim().length < MIN_SEARCH_QUERY_LENGTH) {
    return NextResponse.json({ error: "query is too short" }, { status: 400 });
  }

  const articles = await fetchLatestNewsForQuery(query);
  return NextResponse.json({ articles });
}
