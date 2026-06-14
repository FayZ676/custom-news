import { NextResponse } from "next/server";

import { MIN_SEARCH_QUERY_LENGTH } from "@/lib/newsSearch";
import { searchProviders } from "@/lib/providers/search.server";
import { createClient } from "@/lib/supabase/server";
import { getUserSourceKeys } from "@/lib/supabase/queries/user_sources";

export async function POST(request: Request) {
  const { query } = await request.json().catch(() => ({}));
  if (typeof query !== "string" || query.trim().length < MIN_SEARCH_QUERY_LENGTH) {
    return NextResponse.json({ error: "query is too short" }, { status: 400 });
  }

  // Live search has no refined payload, so the raw query becomes a minimal one.
  // It runs against NewsData.io plus the signed-in user's subscribed sources;
  // anonymous callers fall back to NewsData.io only.
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims.sub as string | undefined;
  const subscribedKeys = userId
    ? await getUserSourceKeys(supabase, userId)
    : [];

  const articles = await searchProviders(
    {
      q: query,
      qInTitle: null,
      category: null,
      country: null,
      timeframe: null,
    },
    subscribedKeys,
  );
  return NextResponse.json({ articles });
}
