// @ts-nocheck

import { createClient } from "jsr:@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

const BACKEND_URL = Deno.env.get("BACKEND_URL")!;
const MAX_ARTICLES_PER_INTEREST = parseInt(
  Deno.env.get("MAX_ARTICLES_PER_INTEREST") ?? "50",
);

Deno.serve(async () => {
  try {
    // 1. Delete all existing articles (cascades to user_article_scores)
    const { error: deleteError } = await supabase
      .from("global_articles")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000"); // delete all rows

    if (deleteError) throw deleteError;

    // 2. Load all feeds with id and url
    const { data: feeds, error: feedsError } = await supabase
      .from("global_feeds")
      .select("id, url");

    if (feedsError) throw feedsError;

    // 3. Call backend /fetch_articles with feed objects
    const res = await fetch(`${BACKEND_URL}/fetch_articles`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": Deno.env.get("BACKEND_API_KEY")!,
      },
      body: JSON.stringify({ feeds }),
    });

    if (!res.ok) throw new Error(`Backend error: ${res.statusText}`);

    const articles = await res.json();

    // 4. Transform and insert articles
    const articlesToInsert = articles.map((a: any) => ({
      feed_id: a.feed_id,
      title: a.article.title,
      url: a.article.link,
      content:
        a.article.content || a.article.description || a.article.summary || "",
      published_at: a.article.published,
      embeddings: a.embeddings,
      embedding_model: a.embeddings_model,
    }));

    const { error: insertError } = await supabase
      .from("global_articles")
      .insert(articlesToInsert);

    if (insertError) throw insertError;

    // 5. Load all user interests
    const { data: interests, error: interestsError } = await supabase
      .from("user_interests")
      .select("id, user_id, embeddings");

    if (interestsError) throw interestsError;

    // 6. For each interest, rank articles and store top N scores
    for (const interest of interests) {
      const { data: topArticles, error: rpcError } = await supabase.rpc(
        "match_articles",
        {
          query_embedding: interest.embedding,
          match_count: MAX_ARTICLES_PER_INTEREST,
        },
      );

      if (rpcError) throw rpcError;

      const scores = topArticles.map(
        (a: { id: string; similarity: number }) => ({
          user_id: interest.user_id,
          interest_id: interest.id,
          article_id: a.id,
          score: a.similarity,
        }),
      );

      const { error: scoresError } = await supabase
        .from("user_article_scores")
        .insert(scores);

      if (scoresError) throw scoresError;
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("fetch-articles error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
