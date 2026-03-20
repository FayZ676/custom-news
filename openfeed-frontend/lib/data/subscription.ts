import { cacheTag } from "next/cache";

import { createServiceRoleClient } from "@/lib/supabase/server";

export async function getUserCategories(userId: string) {
  "use cache";
  cacheTag(`categories:${userId}`);

  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("user_category_subscriptions")
    .select("global_categories(id, name)");

  if (error) throw new Error(error.message);
  return data;
}
