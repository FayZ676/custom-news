// @ts-nocheck

import { parseFeed } from "../_shared/parse_feed.ts";

Deno.serve(async (req) => {
  try {
    const { url } = await req.json();
    if (!url || typeof url !== "string") {
      return Response.json({ error: "Missing 'url'" }, { status: 400 });
    }

    const articles = await parseFeed(url);
    return Response.json(articles);
  } catch (e) {
    console.error("parse_feed error:", e);
    return Response.json({ error: (e as Error).message }, { status: 500 });
  }
});
