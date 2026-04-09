import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/lib/supabase/supabase.types";

export async function getUserSettings(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<Database["public"]["Tables"]["user_settings"]["Row"]> {
  const { data: rows, error } = await supabase
    .from("user_settings")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error) throw new Error(error.message);

  return rows;
}

export async function updateUserNotificationSettings(
  supabase: SupabaseClient<Database>,
  userId: string,
  emailNotifications: boolean,
) {
  const { error } = await supabase
    .from("user_settings")
    .update({ email_notification: emailNotifications })
    .eq("user_id", userId);

  if (error) throw new Error(error.message);
}
