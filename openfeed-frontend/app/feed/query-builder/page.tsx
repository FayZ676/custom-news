import { redirect } from "next/navigation";

import { getAuthenticatedUser } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";
import { getUserInterests } from "@/lib/supabase/queries/user_interests";
import { getGlobalSources } from "@/lib/supabase/queries/global_sources";
import type { FeedDefinition } from "@/lib/providers/types";
import { QueryBuilderPageContent } from "./QueryBuilderPageContent";

const NEWSDATA_SOURCE: FeedDefinition = {
  key: "newsdata",
  label: "Default News Data",
  feedUrl: "",
};

interface QueryBuilderPageProps {
  searchParams: Promise<{ id?: string }>;
}

export default async function QueryBuilderPage({ searchParams }: QueryBuilderPageProps) {
  const { userId } = await getAuthenticatedUser();
  const supabase = await createClient();

  const { id } = await searchParams;

  const rssFeeds = await getGlobalSources(supabase);
  const availableSources = [NEWSDATA_SOURCE, ...rssFeeds];

  let initialName = "";
  let initialAll: string[] = [];
  let initialAny: string[] = [];
  let initialSources: string[] = [];

  if (id) {
    const interests = await getUserInterests(supabase, userId);
    const interest = interests.find((i) => i.id === id);
    if (!interest) redirect("/feed");
    initialName = interest.interest_text;
    initialAll = interest.query_payload?.all ?? [];
    initialAny = interest.query_payload?.any ?? [];
    initialSources = interest.query_payload?.sources ?? [];
  }

  return (
    <QueryBuilderPageContent
      userId={userId}
      interestId={id}
      initialName={initialName}
      initialAll={initialAll}
      initialAny={initialAny}
      initialSources={initialSources}
      availableSources={availableSources}
    />
  );
}
