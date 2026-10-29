import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  platform: "node",
  target: "node22",
  outDir: "dist",
  bundle: true,
  clean: true,
  skipNodeModulesBundle: true,
  sourcemap: true,
  minify: false,
  splitting: false,
});
