import { SupabaseClient } from "@supabase/supabase-js";
import { Database, Tables } from "@/lib/supabase/supabase.types";

export type UserCategory = Tables<"user_categories">;
export type SubCategory = Tables<"global_sub_categories">;

export async function getUserCategories(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<UserCategory[]> {
  const { data, error } = await supabase
    .from("user_categories")
    .select("*")
    .eq("user_id", userId)
    .order("position", { ascending: true });

  if (error) throw new Error(error.message);
  return data;
}

export async function getAllSubCategoriesForCategory(
  supabase: SupabaseClient<Database>,
  categoryName: string,
): Promise<SubCategory[]> {
  const { data, error } = await supabase
    .from("global_sub_categories")
    .select("*")
    .eq("category_name", categoryName);

  if (error) throw new Error(error.message);
  return data;
}

export async function getUserSubCategoryNames(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<string[]> {
  const { data, error } = await supabase
    .from("user_sub_categories")
    .select("sub_category_name")
    .eq("user_id", userId);

  if (error) throw new Error(error.message);
  return data.map((r) => r.sub_category_name);
}

export async function subscribeToCategory(
  supabase: SupabaseClient<Database>,
  userId: string,
  categoryName: string,
): Promise<void> {
  // Append at max(position) + 1
  const { data: existing } = await supabase
    .from("user_categories")
    .select("position")
    .eq("user_id", userId)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();

  const position = existing ? existing.position + 1 : 1;

  const { error } = await supabase
    .from("user_categories")
    .insert({ user_id: userId, category_name: categoryName, position });

  if (error) throw new Error(error.message);
}

export async function unsubscribeFromCategory(
  supabase: SupabaseClient<Database>,
  userId: string,
  categoryName: string,
): Promise<void> {
  const { error } = await supabase
    .from("user_categories")
    .delete()
    .eq("user_id", userId)
    .eq("category_name", categoryName);

  if (error) throw new Error(error.message);
}

export async function updateCategoryPositions(
  supabase: SupabaseClient<Database>,
  userId: string,
  orderedCategoryNames: string[],
): Promise<void> {
  const updates = orderedCategoryNames.map((categoryName, index) =>
    supabase
      .from("user_categories")
      .update({ position: index + 1 })
      .eq("user_id", userId)
      .eq("category_name", categoryName),
  );
  await Promise.all(
    updates.map((u) =>
      u.then(({ error }) => {
        if (error) throw new Error(error.message);
      }),
    ),
  );
}

export async function subscribeToAllSubCategoriesForCategory(
  supabase: SupabaseClient<Database>,
  userId: string,
  categoryName: string,
): Promise<void> {
  const subCategories = await getAllSubCategoriesForCategory(
    supabase,
    categoryName,
  );
  if (subCategories.length === 0) return;

  const { error } = await supabase.from("user_sub_categories").upsert(
    subCategories.map((sc) => ({
      user_id: userId,
      sub_category_name: sc.name,
    })),
    { onConflict: "user_id,sub_category_name", ignoreDuplicates: true },
  );

  if (error) throw new Error(error.message);
}

export async function unsubscribeFromAllSubCategoriesForCategory(
  supabase: SupabaseClient<Database>,
  userId: string,
  categoryName: string,
): Promise<void> {
  const subCategories = await getAllSubCategoriesForCategory(
    supabase,
    categoryName,
  );
  if (subCategories.length === 0) return;

  const { error } = await supabase
    .from("user_sub_categories")
    .delete()
    .eq("user_id", userId)
    .in(
      "sub_category_name",
      subCategories.map((sc) => sc.name),
    );

  if (error) throw new Error(error.message);
}

export async function subscribeToSubCategory(
  supabase: SupabaseClient<Database>,
  userId: string,
  subCategoryName: string,
): Promise<void> {
  const { error } = await supabase
    .from("user_sub_categories")
    .insert({ user_id: userId, sub_category_name: subCategoryName });

  if (error) throw new Error(error.message);
}

export async function unsubscribeFromSubCategory(
  supabase: SupabaseClient<Database>,
  userId: string,
  subCategoryName: string,
): Promise<void> {
  const { error } = await supabase
    .from("user_sub_categories")
    .delete()
    .eq("user_id", userId)
    .eq("sub_category_name", subCategoryName);

  if (error) throw new Error(error.message);
}
