import { Tables } from "./supabase/supabase.types";

export interface Article extends Tables<"global_articles"> {
  is_read?: boolean;
}

export interface Interest {
  id: string;
  query: string;
}

export async function updateUserArticleScores(
  userId: string,
  interestId: string,
  interestEmbeddings: number[],
) {
  const res = await fetch(`${process.env.BACKEND_URL}/user/interests`, {
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

export async function readUserArticle(userId: string, articleId: string) {
  const params = new URLSearchParams({
    user_id: userId,
    article_id: articleId,
  });
  const res = await fetch(
    `${process.env.BACKEND_URL}/user/articles/read?${params}`,
    {
      method: "PATCH",
      headers: {
        "x-api-key": process.env.BACKEND_API_KEY!,
        "Content-Type": "application/json",
      },
    },
  );

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

export async function getGlobalArticlesBySearch(query: string) {
  const params = new URLSearchParams({
    query: String(query),
  });
  const res = await fetch(
    `${process.env.BACKEND_URL}/global/articles/search?${params}`,
    {
      method: "POST",
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

export async function getUserArticlesForInterest(
  userId: string,
  interestId: string,
) {
  const params = new URLSearchParams({
    user_id: String(userId),
    interest_id: String(interestId),
  });
  const res = await fetch(
    `${process.env.BACKEND_URL}/user/articles?${params}`,
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

  return res.json() as Promise<Article[]>;
}

export async function getUserInterests(userId: string) {
  const params = new URLSearchParams({
    user_id: String(userId),
  });
  const res = await fetch(
    `${process.env.BACKEND_URL}/user/interests?${params}`,
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

  return res.json() as Promise<Interest[]>;
}
