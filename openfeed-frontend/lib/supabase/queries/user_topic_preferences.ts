import { SupabaseClient } from "@supabase/supabase-js";

import { Database } from "@/lib/supabase/supabase.types";

export async function addDislikedTopics(
  supabase: SupabaseClient<Database>,
  userId: string,
  medtopIds: string[],
): Promise<void> {
  if (medtopIds.length === 0) return;

  const rows = medtopIds.map((medtop_id) => ({
    user_id: userId,
    medtop_id,
    preference: "disliked",
  }));

  const { error } = await supabase
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .from("user_topic_preferences" as any)
    .upsert(rows);

  if (error) throw new Error(error.message);
}

export async function addLikedTopics(
  supabase: SupabaseClient<Database>,
  userId: string,
  medtopIds: string[],
): Promise<void> {
  if (medtopIds.length === 0) return;

  const rows = medtopIds.map((medtop_id) => ({
    user_id: userId,
    medtop_id,
    preference: "liked",
  }));

  const { error } = await supabase
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .from("user_topic_preferences" as any)
    .upsert(rows);

  if (error) throw new Error(error.message);
}
