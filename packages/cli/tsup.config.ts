import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/cli.ts", "src/bin.ts"],
  format: ["esm"],
  target: "node20",
  platform: "node",
  dts: true,
  clean: true,
  sourcemap: true,
  noExternal: ["@agentvision/core"],
  esbuildOptions(options) {
    // Allow CJS modules (like fast-glob) to work inside ESM bundles
    options.banner = {
      js: `import { createRequire } from 'module'; const require = createRequire(import.meta.url);`,
    };
  },
});
