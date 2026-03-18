// @ts-nocheck

import { embed } from "../embed/index.ts";

let passed = 0;
let failed = 0;

console.log("\n── Embedding Single String ──\n");

const input = ["Climate change is accelerating across the globe."];

try {
  const result = await embed(input);

  if (result.embeddings.length !== 1) {
    throw new Error(`Expected 1 embedding, got ${result.embeddings.length}`);
  }

  if (result.embeddings[0].length === 0) {
    throw new Error("Embedding vector is empty");
  }

  console.log(
    `✓ Embedding Single String — ${result.embeddings[0].length} dimensions, model=${result.model}`,
  );
  passed++;
} catch (e) {
  console.error(`✗ Embedding Single String — ${(e as Error).message}`);
  failed++;
}

// ─── Summary ────────────────────────────────────────────────

console.log(`\n${"─".repeat(50)}`);
console.log(`Results: ${passed} passed, ${failed} failed, 1 total`);
Deno.exit(failed > 0 ? 1 : 0);
