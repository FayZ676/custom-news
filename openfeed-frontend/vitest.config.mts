import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(fileURLToPath(new URL(".", import.meta.url)));

export default defineConfig({
  resolve: {
    alias: [
      // `server-only` has no runtime in the node test env — stub it out.
      {
        find: "server-only",
        replacement: path.resolve(root, "test/server-only-stub.ts"),
      },
      // Mirror tsconfig's "@/*" -> "./*" path mapping.
      { find: /^@\/(.*)$/, replacement: `${root}/$1` },
    ],
  },
});
