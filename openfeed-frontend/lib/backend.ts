import { Tables } from "./supabase/supabase.types";

export async function updateUserArticleScores(
  userId: string,
  interestId: string,
  interestEmbeddings: number[],
) {
  const res = await fetch(`${process.env.BACKEND_URL}/user/interest`, {
    method: "POST",
    headers: {
      "x-api-key": process.env.BACKEND_API_KEY!,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      user_id: userId,
      interest_id: interestId,
      interest_embeddings: interestEmbeddings,
    }),
  });

  if (!res.ok) {
    throw new Error(`Backend API error (${res.status}): ${await res.text()}`);
  }
}

export async function getGlobalArticlesByPage(
  page: number,
  pageSize: number = 20,
) {
  const params = new URLSearchParams({
    page: String(page),
    page_size: String(pageSize),
  });
  const res = await fetch(
    `${process.env.BACKEND_URL}/global/articles?${params}`,
    {
      method: "GET",
      headers: {
        "x-api-key": process.env.BACKEND_API_KEY!,
      },
    },
  );

  if (!res.ok) {
    throw new Error(`Backend API error (${res.status}): ${await res.text()}`);
  }

  return res.json() as Promise<Tables<"global_articles">[]>;
}
