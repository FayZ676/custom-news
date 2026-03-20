import { cacheLife } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function getGlobalCategories() {
  "use cache";
  cacheLife("max");

  const supabase = await createClient();
  const { data: categories, error } = await supabase
    .from("global_categories")
    .select("id, name, interest_suggestions");
  if (error) throw new Error(error.message);
  return categories;
}
