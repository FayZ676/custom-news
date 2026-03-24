export async function updateUserArticleScores(
  userId: string,
  interestId: string,
  interestEmbeddings: number[],
) {
  const res = await fetch(`${process.env.BACKEND_URL}/user/articles/scores`, {
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
