import { cacheLife } from "next/cache";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

export async function getGlobalCategories() {
  "use cache";
  cacheLife("max");

  const supabase = createServiceRoleClient();
  const { data: categories, error } = await supabase
    .from("global_categories")
    .select("id, name, interest_suggestions");
  if (error) throw new Error(error.message);
  return categories;
}
