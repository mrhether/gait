import { defineConfig } from "vite";

export default defineConfig({
  build: {
    lib: {
      entry: "./src/index.ts",
      formats: ["cjs"], // CommonJS for Node.js CLI
      fileName: "index",
    },
    outDir: "dist",
    rollupOptions: {
      external: ["commander", "openai", "dotenv", "child_process"], // Exclude dependencies
    },
  },
});
