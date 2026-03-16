import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    root: ".",
    include: ["packages/*/src/**/*.test.ts"],
  },
});
