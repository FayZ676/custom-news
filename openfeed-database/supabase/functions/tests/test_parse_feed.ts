// @ts-nocheck

import { parseFeed } from "../parse_feed/index.ts";

// ─── Load feed URLs from seed file ─────────────────────────

const sql = await Deno.readTextFile(
  new URL("../../seeds/02_global_feeds.sql", import.meta.url),
);

const feeds: { title: string; url: string }[] = [];
const pattern = /\('([^']+)',\s*'(https?:\/\/[^']+)',\s*'[^']*'\)/g;
let match;
while ((match = pattern.exec(sql)) !== null) {
  feeds.push({ title: match[1], url: match[2] });
}

// ─── Validate each feed ────────────────────────────────────

console.log(`\nValidating ${feeds.length} feeds...\n`);

let passed = 0;
let failed = 0;

for (const { title, url } of feeds) {
  try {
    const articles = await parseFeed(url);

    if (articles.length === 0) {
      console.error(`✗ ${title} — 0 articles`);
      failed++;
    } else {
      console.log(`✓ ${title} — ${articles.length} articles`);
      passed++;
    }
  } catch (e) {
    console.error(`✗ ${title} — ${(e as Error).message}`);
    failed++;
  }
}

// ─── Summary ────────────────────────────────────────────────

console.log(`\n${"─".repeat(50)}`);
console.log(
  `Results: ${passed} passed, ${failed} failed, ${feeds.length} total`,
);
Deno.exit(failed > 0 ? 1 : 0);
