import { PaginatedStories } from "@/lib/supabase/queries/global_stories";

const BACKEND_URL = process.env.BACKEND_URL;
const BACKEND_API_KEY = process.env.BACKEND_API_KEY;

function getBackendHeaders(): HeadersInit {
  if (!BACKEND_API_KEY) throw new Error("BACKEND_API_KEY is not set");
  return {
    "Content-Type": "application/json",
    "x-api-key": BACKEND_API_KEY,
  };
}

export async function getUserFeed(
  userId: string,
  page: number,
  pageSize: number,
): Promise<PaginatedStories> {
  if (!BACKEND_URL) throw new Error("BACKEND_URL is not set");

  const params = new URLSearchParams({
    page: String(page),
    page_size: String(pageSize),
  });

  const res = await fetch(
    `${BACKEND_URL}/feed/${userId}?${params.toString()}`,
    {
      method: "POST",
      headers: getBackendHeaders(),
      cache: "no-store",
    },
  );

  if (!res.ok) {
    throw new Error(
      `Backend /feed/${userId}?${params.toString()} returned ${res.status}`,
    );
  }

  return res.json() as Promise<PaginatedStories>;
}
