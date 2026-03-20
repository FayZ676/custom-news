import { getGlobalCategories } from "@/actions/categories";
import { OnboardingForm } from "@/components/OnboardingForm";

export default async function OnboardingPage() {
  const categories = await getGlobalCategories();
  return <OnboardingForm categories={categories} />;
}
