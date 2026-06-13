import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/lib/supabase/supabase.types";

export type ShareContentType = "article";

export async function createShareLink(
  supabase: SupabaseClient<Database>,
  userId: string,
  contentType: "article",
  contentId: string,
): Promise<string> {
  const { data, error } = await supabase
    .from("global_share_links")
    .insert({
      content_type: contentType,
      content_id: contentId,
      created_by: userId,
    })
    .select("token")
    .single();

  if (error) throw new Error("Failed to create share link");
  return data.token;
}
