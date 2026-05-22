import { SupabaseClient } from "@supabase/supabase-js";

import { Database } from "@/lib/supabase/supabase.types";

export interface MedtopTopic {
  id: string;
  name: string;
}

export async function addDislikedTopics(
  supabase: SupabaseClient<Database>,
  userId: string,
  topics: MedtopTopic[],
): Promise<void> {
  if (topics.length === 0) return;

  const rows = topics.map(({ id, name }) => ({
    user_id: userId,
    medtop_id: id,
    medtop_name: name,
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
  topics: MedtopTopic[],
): Promise<void> {
  if (topics.length === 0) return;

  const rows = topics.map(({ id, name }) => ({
    user_id: userId,
    medtop_id: id,
    medtop_name: name,
    preference: "liked",
  }));

  const { error } = await supabase
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .from("user_topic_preferences" as any)
    .upsert(rows);

  if (error) throw new Error(error.message);
}
