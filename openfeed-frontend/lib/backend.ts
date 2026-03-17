const BACKEND_URL = process.env.BACKEND_URL!;

const headers = {
  "Content-Type": "application/json",
  "X-API-Key": process.env.BACKEND_API_KEY!,
};

export async function fetchArticles(feedUrls: string[]) {
  const res = await fetch(`${BACKEND_URL}/fetch_articles`, {
    method: "POST",
    headers,
    body: JSON.stringify({ feeds: feedUrls }),
  });
  if (!res.ok) throw new Error(`Backend error: ${res.statusText}`);
  return res.json();
}

export async function embedText(text: string): Promise<{
  embeddings: number[];
  model: string;
}> {
  const res = await fetch(`${BACKEND_URL}/embed`, {
    method: "POST",
    headers,
    body: JSON.stringify({ text }),
  });
  if (!res.ok) throw new Error(`Backend error: ${res.statusText}`);
  return res.json();
}
