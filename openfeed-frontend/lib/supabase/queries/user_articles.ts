import { SupabaseClient } from "@supabase/supabase-js";

import { Database, TablesInsert } from "@/lib/supabase/supabase.types";

const USER_ARTICLE_COLUMNS = `
  id, article_id, interest_id, created_at, read_at,
  article:global_articles!inner (
    source_name, title, url, summary, image_url, published_at
  )
`;

// A feed entry: the user's row flattened together with the shared article.
export interface UserArticle {
  id: string;
  article_id: string;
  interest_id: string;
  created_at: string;
  read_at: string | null;
  source_name: string;
  title: string;
  url: string;
  summary: string | null;
  image_url: string | null;
  published_at: string;
}

export type SharedArticle =
  Database["public"]["Functions"]["get_shared_article"]["Returns"][number];

type ArticleFields =
  | "source_name"
  | "title"
  | "url"
  | "summary"
  | "image_url"
  | "published_at";

function flatten({
  article,
  ...row
}: Omit<UserArticle, ArticleFields> & {
  article: Pick<UserArticle, ArticleFields>;
}): UserArticle {
  return { ...row, ...article };
}

export async function getUserArticles(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<UserArticle[]> {
  const { data, error } = await supabase
    .from("user_articles")
    .select(USER_ARTICLE_COLUMNS)
    .eq("user_id", userId);

  if (error) throw new Error(error.message);
  return data
    .map(flatten)
    .sort((a, b) => b.published_at.localeCompare(a.published_at));
}

export async function getUserArticleById(
  supabase: SupabaseClient<Database>,
  userId: string,
  articleId: string,
): Promise<UserArticle | null> {
  const { data, error } = await supabase
    .from("user_articles")
    .select(USER_ARTICLE_COLUMNS)
    .eq("user_id", userId)
    .eq("id", articleId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ? flatten(data) : null;
}

export async function insertUserArticles(
  supabase: SupabaseClient<Database>,
  rows: TablesInsert<"user_articles">[],
): Promise<void> {
  if (rows.length === 0) return;

  const { error } = await supabase
    .from("user_articles")
    .upsert(rows, { onConflict: "user_id,article_id", ignoreDuplicates: true });

  if (error) throw new Error(error.message);
}

// Read articles stay in the feed when an interest is edited.
export async function deleteUnreadArticlesForInterest(
  supabase: SupabaseClient<Database>,
  interestId: string,
): Promise<void> {
  const { error } = await supabase
    .from("user_articles")
    .delete()
    .eq("interest_id", interestId)
    .is("read_at", null);

  if (error) throw new Error(error.message);
}

export async function markArticleRead(
  supabase: SupabaseClient<Database>,
  userId: string,
  articleId: string,
): Promise<void> {
  const { error } = await supabase
    .from("user_articles")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", userId)
    .eq("id", articleId);

  if (error) throw new Error(error.message);
}

export async function getSharedArticle(
  supabase: SupabaseClient<Database>,
  token: string,
): Promise<SharedArticle | null> {
  // Security-definer RPC: a valid share token grants read access to the
  // single linked article, which RLS would otherwise hide from anonymous
  // visitors.
  const { data, error } = await supabase
    .rpc("get_shared_article", { p_token: token })
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
}
