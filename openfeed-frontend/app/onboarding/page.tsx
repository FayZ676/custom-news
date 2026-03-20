import { Suspense } from "react";
import { getGlobalCategories } from "@/actions/categories";
import { OnboardingForm } from "@/components/OnboardingForm";

async function OnboardingContent() {
  const categories = await getGlobalCategories();
  return <OnboardingForm categories={categories} />;
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={<div>Loading onboarding ...</div>}>
      <OnboardingContent />
    </Suspense>
  );
}
