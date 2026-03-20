import { cacheLife, cacheTag } from "next/cache";

import { createServiceRoleClient } from "@/lib/supabase/server";

export async function getUserCategories(userId: string) {
  "use cache";
  cacheLife({ stale: 3600, revalidate: 3600, expire: 7200 });
  cacheTag(`categories:${userId}`);

  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("user_category_subscriptions")
    .select("global_categories(id, name)");

  if (error) throw new Error(error.message);
  return data;
}
