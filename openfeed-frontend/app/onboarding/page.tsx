import { createClient } from "@/lib/supabase/server";
import { OnboardingForm } from "@/components/OnboardingForm";

export default async function OnboardingPage() {
  const supabase = await createClient();

  const { data: categories, error } = await supabase
    .from("global_categories")
    .select("id, name, interest_suggestions");

  if (error) throw new Error(error.message);

  return <OnboardingForm categories={categories} />;
}
