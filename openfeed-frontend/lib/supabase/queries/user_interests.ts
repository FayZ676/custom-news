import { embedTexts } from "@/lib/embeddings";
import { SupabaseClient } from "@supabase/supabase-js";
import { Database, Tables } from "@/lib/supabase/supabase.types";

import { InterestStory } from "./user_stories";

export interface InterestStories {
  id: string;
  query: string;
  stories: InterestStory[];
}

export async function insertUserInterest(
  supabase: SupabaseClient,
  userId: string,
  query: string,
) {
  const embedData = await embedTexts([query]);
  const embeddings: number[] = embedData.embeddings[0];

  const { data: interest, error } = await supabase
    .from("user_interests")
    .insert({
      user_id: userId,
      query,
      embeddings: JSON.stringify(embeddings),
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);
  return { interestId: interest.id, interestEmbeddings: embeddings };
}

export async function deleteUserInterest(
  supabase: SupabaseClient,
  userId: string,
  interestId: string,
) {
  const { error } = await supabase
    .from("user_interests")
    .delete()
    .eq("id", interestId)
    .eq("user_id", userId);

  if (error) throw new Error(error.message);
}

export async function getUserInterestStories(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<InterestStories[]> {
  const { data: rows, error } = await supabase
    .from("user_interests")
    .select("id, query, user_stories(is_read, score, global_stories(*))")
    .eq("user_id", userId);

  if (error) throw new Error(error.message);

  return (rows ?? []).map((r) => ({
    id: r.id,
    query: r.query,
    stories: (r.user_stories as any[])
      .map((us) => ({
        is_read: us.is_read,
        score: us.score,
        global_story: us.global_stories as Tables<"global_stories">,
      }))
      .sort((a: InterestStory, b: InterestStory) => b.score - a.score),
  }));
}
