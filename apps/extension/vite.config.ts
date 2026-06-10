import { copyFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { defineConfig } from "vite";

function copyManifest() {
  return {
    name: "copy-manifest",
    closeBundle() {
      mkdirSync("dist", { recursive: true });
      copyFileSync("src/manifest.json", "dist/manifest.json");
    }
  };
}

export default defineConfig({
  build: {
    emptyOutDir: true,
    rollupOptions: {
      input: {
        background: resolve(__dirname, "src/background.ts"),
        content: resolve(__dirname, "src/content.ts"),
        injected: resolve(__dirname, "src/injected.ts")
      },
      output: {
        entryFileNames: "[name].js"
      }
    }
  },
  plugins: [copyManifest()]
});
