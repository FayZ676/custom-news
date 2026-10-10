import { redirect } from "next/navigation";

import { getAuthenticatedUser } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";
import { getUserInterests } from "@/lib/supabase/queries/user_interests";
import { QueryBuilderPageContent } from "./QueryBuilderPageContent";

interface QueryBuilderPageProps {
  searchParams: Promise<{ id?: string }>;
}

export default async function QueryBuilderPage({ searchParams }: QueryBuilderPageProps) {
  const { userId } = await getAuthenticatedUser();
  const supabase = await createClient();

  const { id } = await searchParams;

  let initialText = "";
  if (id) {
    const interests = await getUserInterests(supabase, userId);
    const interest = interests.find((i) => i.id === id);
    if (!interest) redirect("/feed");
    initialText = interest.interest_text;
  }

  return <QueryBuilderPageContent interestId={id} initialText={initialText} />;
}
