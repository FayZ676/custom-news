import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/lib/supabase/supabase.types";

export async function getUserTopics(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<Database["public"]["Tables"]["user_topics"]["Row"][]> {
  const { data, error } = await supabase
    .from("user_topics")
    .select("*")
    .eq("user_id", userId)
    .order("topic_id", { ascending: true });

  if (error) throw new Error(error.message);
  return data;
}

export async function addUserTopic(
  supabase: SupabaseClient<Database>,
  userId: string,
  topicId: string,
): Promise<Database["public"]["Tables"]["user_topics"]["Row"]> {
  const { data, error } = await supabase
    .from("user_topics")
    .insert({
      user_id: userId,
      topic_id: topicId,
    })
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function removeUserTopic(
  supabase: SupabaseClient<Database>,
  userId: string,
  topicId: string,
): Promise<void> {
  const { error } = await supabase
    .from("user_topics")
    .delete()
    .eq("user_id", userId)
    .eq("topic_id", topicId);

  if (error) throw new Error(error.message);
}
