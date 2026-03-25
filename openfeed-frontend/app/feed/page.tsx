import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { getUserInterests } from "@/lib/data/interests";
import { getUserCategories } from "@/lib/data/subscription";

export default async function FeedPage() {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  if (!claimsData) throw new Error("Not authenticated");

  const userId = claimsData.claims.sub;
  const interests = await getUserInterests(userId);

  if (!interests || interests.length === 0) {
    const categories = await getUserCategories(userId);
    if (categories && categories.length > 0) {
      redirect("/feed/new-interest");
    }
    redirect("/onboarding");
  }

  redirect(`/feed/${interests[0].id}`);
}
