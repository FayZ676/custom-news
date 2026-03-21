import { cacheLife, cacheTag } from "next/cache";

import { createServiceRoleClient } from "@/lib/supabase/service-role";

export async function getUserInterests(userId: string) {
  "use cache";
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
