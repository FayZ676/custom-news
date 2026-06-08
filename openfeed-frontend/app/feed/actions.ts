"use server";

import { createClient } from "@/lib/supabase/server";
import { createShareLink } from "@/lib/supabase/queries/global_share_links";
import { ArticleMetadataField } from "@/lib/supabase/queries/global_article_metadata_options";
import {
  addUserArticleMetadataOption,
  getUserArticleMetadataOptions,
  removeUserArticleMetadataOption,
} from "@/lib/supabase/queries/user_article_metadata_options";

export async function createShareLinkAction(
  userId: string,
  contentType: "article",
  contentId: string,
): Promise<string> {
  const supabase = await createClient();
  return createShareLink(supabase, userId, contentType, contentId);
}

export async function changeMetadataOptionsAction(
  userId: string,
  field: ArticleMetadataField,
  nextOptionNames: string[],
): Promise<void> {
  const supabase = await createClient();
  const existingRows = await getUserArticleMetadataOptions(supabase, userId);
  const existingNames = new Set(
    existingRows.filter((row) => row.field === field).map((row) => row.name),
  );
  const desiredNames = new Set(
    nextOptionNames.map((name) => name.trim()).filter(Boolean),
  );

  const toAdd = [...desiredNames].filter((name) => !existingNames.has(name));
  const toRemove = [...existingNames].filter((name) => !desiredNames.has(name));

  await Promise.all([
    ...toAdd.map((name) =>
      addUserArticleMetadataOption(supabase, userId, field, name),
    ),
    ...toRemove.map((name) =>
      removeUserArticleMetadataOption(supabase, userId, field, name),
    ),
  ]);
}
