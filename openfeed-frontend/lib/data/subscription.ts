import { createServiceRoleClient } from "@/lib/supabase/service-role";

export async function getUserCategories(userId: string) {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("user_category_subscriptions")
    .select("global_categories(id, name)");

  if (error) throw new Error(error.message);
  return data;
}
