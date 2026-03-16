const BACKEND_URL = process.env.BACKEND_URL!;

export async function fetchArticles(feedUrls: string[]) {
  const res = await fetch(`${BACKEND_URL}/articles`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
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
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });

  if (!res.ok) throw new Error(`Backend error: ${res.statusText}`);

  return res.json();
}
