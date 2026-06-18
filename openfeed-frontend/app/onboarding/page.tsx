import { Suspense } from "react";
import { redirect } from "next/navigation";

import { getAuthenticatedUser } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";
import { getUserInterests } from "@/lib/supabase/queries/user_interests";
import OnboardingQueryBuilder from "./OnboardingQueryBuilder";

async function OnboardingContent() {
  const supabase = await createClient();
  const { userId } = await getAuthenticatedUser();

  const interests = await getUserInterests(supabase, userId);
  if (interests.length > 0) redirect("/feed");

  return (
    <OnboardingQueryBuilder userId={userId} />
  );
}

export default function OnboardingPage() {
  return (
    <Suspense>
      <OnboardingContent />
    </Suspense>
  );
}
