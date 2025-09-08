import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "jsdom",
    include: ["lib/**/*.test.{ts,tsx}", "lib/**/*.spec.{ts,tsx}"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        "node_modules/",
        "dist/",
        "lib/test/",
        "**/*.d.ts",
        "**/*.config.*",
        "e2e/",
      ],
    },
  },
});
