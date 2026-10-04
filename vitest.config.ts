import path from "node:path"

import { defineConfig } from "vitest/config"

export default defineConfig({
  resolve: {
    alias: { "@": path.resolve(__dirname, "src") },
  },
  test: {
    // Integration tests copy the database; give them room on a cold start.
    testTimeout: 30_000,
  },
})
