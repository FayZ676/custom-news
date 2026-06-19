import { SupabaseClient } from "@supabase/supabase-js";
import { cacheTag, cacheLife, revalidateTag } from "next/cache";
import { Database } from "@/lib/supabase/supabase.types";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

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

export async function getCachedUserSettings(
  userId: string,
): Promise<Database["public"]["Tables"]["user_settings"]["Row"]> {
  "use cache";
  cacheTag(`user-settings:${userId}`);
  cacheLife("days");
  const supabase = createServiceRoleClient();
  return getUserSettings(supabase, userId);
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
  revalidateTag(`user-settings:${userId}`, { expire: 0 });
}

export async function updateUserTimezone(
  supabase: SupabaseClient<Database>,
  userId: string,
  timezone: string,
) {
  const { error } = await supabase
    .from("user_settings")
    .update({ timezone })
    .eq("user_id", userId);

  if (error) throw new Error(error.message);
  revalidateTag(`user-settings:${userId}`, { expire: 0 });
}

export async function setFeedLastSeen(
  supabase: SupabaseClient<Database>,
  userId: string,
) {
  const { error } = await supabase
    .from("user_settings")
    .update({ feed_last_seen_at: new Date().toISOString() })
    .eq("user_id", userId);

  if (error) throw new Error(error.message);
}

export async function updateUserTheme(
  supabase: SupabaseClient<Database>,
  userId: string,
  colorTheme: string,
) {
  const { error } = await supabase
    .from("user_settings")
    .update({ color_theme: colorTheme })
    .eq("user_id", userId);

  if (error) throw new Error(error.message);
  revalidateTag(`user-settings:${userId}`, { expire: 0 });
}
