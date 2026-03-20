import { cacheLife, cacheTag } from "next/cache";

import { createServiceRoleClient } from "@/lib/supabase/server";

export async function getUserInterests(userId: string) {
  "use cache";
  cacheLife({ stale: 3600, revalidate: 3600, expire: 7200 });
  cacheTag(`interests:${userId}`);

  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("user_interests")
    .select("id, query")
    .eq("user_id", userId)
    .order("created_at");

  if (error) throw new Error(error.message);
  return data;
}
