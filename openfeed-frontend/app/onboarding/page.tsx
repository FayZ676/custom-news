import { Suspense } from "react";
import { redirect } from "next/navigation";

import { getAuthenticatedUser } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";
import { getUserInterests } from "@/lib/supabase/queries/user_interests";
import { InterestsManager } from "@/components/InterestsManager";
import OnboardingContinueButton from "./OnboardingContinueButton";

async function OnboardingContent() {
  const supabase = await createClient();
  const { userId } = await getAuthenticatedUser();

  const interests = await getUserInterests(supabase, userId);

  if (interests.length > 0) {
    redirect("/feed");
  }

  return (
    <div className="flex flex-col gap-8 max-w-md mx-auto pt-16">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold">What are you interested in?</h1>
        <p className="text-base-content/60 text-sm">
          Add a few topics to get a curated feed of articles tailored to you.
          You can always update these later.
        </p>
      </div>

      <InterestsManager userId={userId} initialInterests={interests} />

      <OnboardingContinueButton />
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense>
      <OnboardingContent />
    </Suspense>
  );
}
