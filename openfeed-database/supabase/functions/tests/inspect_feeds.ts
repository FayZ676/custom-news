// @ts-nocheck

import { parseFeed } from "../_shared/parse_feed.ts";

const sql = await Deno.readTextFile(
  new URL("../../seeds/02_global_feeds.sql", import.meta.url),
);

const feeds: { title: string; url: string }[] = [];
const pattern = /\('([^']+)',\s*'(https?:\/\/[^']+)',\s*'[^']*'\)/g;
let match;
while ((match = pattern.exec(sql)) !== null) {
  feeds.push({ title: match[1], url: match[2] });
}

console.log(`\nInspecting ${feeds.length} feeds...\n`);

for (const { title, url } of feeds) {
  console.log(`${"═".repeat(60)}`);
  console.log(`${title} (${url})`);
  console.log("═".repeat(60));

  try {
    const articles = await parseFeed(url);
    const a = articles[0];
    if (!a) {
      console.log("No articles\n");
      continue;
    }

    const contentValue = a.content?.[0]?.value;

    console.log(`title:   ${a.title.slice(0, 80)}`);
    console.log(
      `summary: ${a.summary ? `[${a.summary.length} chars] ${a.summary.slice(0, 120)}` : "NULL"}`,
    );
    console.log(
      `content: ${contentValue ? `[${contentValue.length} chars] ${contentValue.slice(0, 120)}` : "NULL"}`,
    );
    console.log(
      `same?    ${a.summary && contentValue ? a.summary === contentValue : "N/A"}`,
    );
    console.log();
  } catch (e) {
    console.log(`ERROR: ${(e as Error).message}\n`);
  }
}
