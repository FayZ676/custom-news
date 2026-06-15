import { NextResponse } from "next/server";

import { MIN_SEARCH_QUERY_LENGTH } from "@/lib/newsSearch";
import { searchProviders } from "@/lib/providers/search.server";
import { createClient } from "@/lib/supabase/server";
import { getUserSourceKeys } from "@/lib/supabase/queries/user_sources";
import { getGlobalSourcesByKeys } from "@/lib/supabase/queries/global_sources";

export async function POST(request: Request) {
  const { query } = await request.json().catch(() => ({}));
  if (typeof query !== "string" || query.trim().length < MIN_SEARCH_QUERY_LENGTH) {
    return NextResponse.json({ error: "query is too short" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims.sub as string | undefined;
  const subscribedFeeds = userId
    ? await getGlobalSourcesByKeys(supabase, await getUserSourceKeys(supabase, userId))
    : [];

  const articles = await searchProviders(
    {
      q: query,
      qInTitle: null,
      category: null,
      country: null,
      timeframe: null,
    },
    subscribedFeeds,
  );
  return NextResponse.json({ articles });
}
