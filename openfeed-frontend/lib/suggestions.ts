const SYSTEM_PROMPT = `You are a search query optimizer for a semantic news search engine.
Given a user's search query, generate 4 alternative query reformulations that will help surface relevant news articles.

Produce a mix of:
- More specific or concrete versions of the query
- Different framings or angles on the same topic
- Key entities or terms that commonly appear in articles on this topic

Rules:
- Each suggestion should be a short noun phrase or sentence (5–10 words max)
- Do not include the original query
- Return ONLY a JSON array of strings, nothing else

Example input: "AI regulation"
Example output: ["government oversight of artificial intelligence", "AI safety legislation", "tech industry AI policy", "machine learning regulatory frameworks"]`;

export async function generateQuerySuggestions(
  query: string,
): Promise<string[]> {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-5.4-nano",
      temperature: 0.7,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: query },
      ],
    }),
  });

  if (!response.ok) return [];

  const data = await response.json();
  const raw = data.choices?.[0]?.message?.content ?? "[]";

  try {
    const suggestions: string[] = JSON.parse(raw);
    return suggestions.slice(0, 5);
  } catch {
    return [];
  }
}
