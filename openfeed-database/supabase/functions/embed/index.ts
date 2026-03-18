// @ts-nocheck

import { embed, DIMENSIONS } from "../_shared/embed.ts";

Deno.serve(async (req) => {
  try {
    const { input } = await req.json();

    if (!input) {
      return Response.json({ error: "Missing 'input'" }, { status: 400 });
    }

    const texts: string[] = Array.isArray(input) ? input : [input];

    if (texts.length === 0) {
      return Response.json(
        { error: "'input' must not be empty" },
        { status: 400 },
      );
    }

    const result = await embed(texts);

    return Response.json({
      embeddings: result.embeddings,
      model: result.model,
      dimensions: DIMENSIONS,
    });
  } catch (e) {
    console.error("embed error:", e);
    return Response.json({ error: (e as Error).message }, { status: 500 });
  }
});
